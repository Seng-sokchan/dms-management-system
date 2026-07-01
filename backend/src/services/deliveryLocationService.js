const deliveryAgentLocationsRepository = require("../repositories/deliveryAgentLocations");
const orderRepository = require("../repositories/orders");
const customerRepository = require("../repositories/customers");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../errors");
const {
  hasDataScope,
  getDepotForUser,
} = require("./accessScopeService");
const { getDataScope } = require("./rulesCache");

const TRACKABLE_STATUS = "Ready_For_Delivery";
const PERSIST_MIN_INTERVAL_MS = 30000;
const PERSIST_MOVE_THRESHOLD_M = 50;

/** @type {Map<string, { latitude: number, longitude: number, at: number }>} */
const lastPersistedByAgent = new Map();

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function shouldPersistLocation(agentId, latitude, longitude) {
  const key = String(agentId);
  const prev = lastPersistedByAgent.get(key);
  const now = Date.now();
  if (!prev) return true;
  if (now - prev.at >= PERSIST_MIN_INTERVAL_MS) return true;
  const moved = haversineMeters(prev.latitude, prev.longitude, latitude, longitude);
  return moved >= PERSIST_MOVE_THRESHOLD_M;
}

function markPersisted(agentId, latitude, longitude) {
  lastPersistedByAgent.set(String(agentId), {
    latitude,
    longitude,
    at: Date.now(),
  });
}

/**
 * Upsert latest delivery location when throttle allows.
 * @returns {Promise<boolean>} true if written to DB
 */
async function persistLatestLocation({
  deliveryAgentId,
  latitude,
  longitude,
  accuracy,
  recordedAt,
}) {
  const agentId = String(deliveryAgentId);
  if (!shouldPersistLocation(agentId, latitude, longitude)) {
    return false;
  }
  await deliveryAgentLocationsRepository.upsertLocation({
    deliveryAgentId: agentId,
    latitude,
    longitude,
    accuracy,
    recordedAt,
  });
  markPersisted(agentId, latitude, longitude);
  return true;
}

function mapRedisLastKnown(parsed, deliveryAgentName) {
  if (!parsed || typeof parsed !== "object") return null;
  const latitude = Number(parsed.latitude);
  const longitude = Number(parsed.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    accuracy:
      parsed.accuracy != null && Number.isFinite(Number(parsed.accuracy))
        ? Number(parsed.accuracy)
        : undefined,
    recordedAt: parsed.updatedAt || parsed.recordedAt || "",
    name: parsed.name || parsed.username || deliveryAgentName || "",
  };
}

function enrichLastKnown(dbLocation, redisBody, deliveryAgentName) {
  const fromRedis = mapRedisLastKnown(redisBody, deliveryAgentName);
  if (fromRedis) return fromRedis;
  if (!dbLocation) return null;
  return {
    ...dbLocation,
    name: deliveryAgentName || "",
  };
}

async function resolveLastKnown(deliveryAgentId, redisClient, deliveryAgentName) {
  let redisBody = null;
  if (redisClient && redisClient.status === "ready") {
    try {
      const key = `dms:delivery:location:${deliveryAgentId}`;
      const raw = await redisClient.get(key);
      if (raw) {
        redisBody = JSON.parse(raw);
      }
    } catch {
      redisBody = null;
    }
  }
  const dbLocation = await deliveryAgentLocationsRepository.getByAgentId(deliveryAgentId);
  return enrichLastKnown(dbLocation, redisBody, deliveryAgentName);
}

async function assertCanTrackOrder(order, user) {
  if (!order) {
    throw new NotFoundError("Order not found");
  }
  if (order.status !== TRACKABLE_STATUS) {
    throw new BadRequestError("Tracking available only at Ready_For_Delivery");
  }
  if (!order.deliveryAgentId) {
    throw new BadRequestError("Delivery agent is not assigned");
  }

  const scope = getDataScope(user?.role);

  if (scope === "customer") {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    if (!customer || String(order.customerId) !== String(customer.id)) {
      throw new ForbiddenError("Forbidden");
    }
    return;
  }

  if (scope === "depot") {
    const depot = await getDepotForUser(user);
    if (!depot) {
      throw new ForbiddenError("Forbidden");
    }
    const customers = await customerRepository.listCustomersByDepotId(depot.id);
    const allowed = customers.some((c) => String(c.id) === String(order.customerId));
    if (!allowed) {
      throw new ForbiddenError("Forbidden");
    }
    return;
  }

  if (scope === "delivery_agent") {
    const agentId =
      user.deliveryAgentId != null && String(user.deliveryAgentId).trim() !== ""
        ? String(user.deliveryAgentId)
        : "";
    if (!agentId || String(order.deliveryAgentId) !== agentId) {
      throw new ForbiddenError("Forbidden");
    }
    return;
  }

  if (scope === "all" || scope === "owner" || scope === "none") {
    return;
  }

  throw new ForbiddenError("Forbidden");
}

async function getOrderDeliveryLocation(orderId, { user, redisClient } = {}) {
  const order = await orderRepository.getOrderById(orderId);
  await assertCanTrackOrder(order, user);

  const deliveryAgentId = String(order.deliveryAgentId);
  const lastKnown = await resolveLastKnown(
    deliveryAgentId,
    redisClient,
    order.deliveryAgentName,
  );

  return {
    deliveryAgentId: Number(deliveryAgentId) || deliveryAgentId,
    lastKnown,
  };
}

module.exports = {
  persistLatestLocation,
  resolveLastKnown,
  getOrderDeliveryLocation,
  enrichLastKnown,
  mapRedisLastKnown,
};
