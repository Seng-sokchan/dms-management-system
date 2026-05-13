const { Server } = require("socket.io");
const Redis = require("ioredis");
const { resolveUserFromAccessToken } = require("../middleware/auth");
const orderRepository = require("../repositories/orders");
const customerRepository = require("../repositories/customers");

const DELIVERY_WATCHERS_ROOM = "delivery-location-watchers";
const DELIVERY_AGENT_ROOM_PREFIX = "delivery-agent:";
const DELIVERY_LOCATION_TTL_SEC = 240;
const WATCHER_ROLES = new Set(["Admin", "Owner", "Logistics", "Depot"]);
/** When Redis is optional and unreachable, log once (short) and drop the client. */
const REDIS_UNREACHABLE_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN"]);

/** True when failure is expected for optional Redis (already logged on `error` or ioredis offline noise). */
function isOptionalRedisPersistenceNoise(err) {
  const nested = Array.isArray(err?.errors) ? err.errors[0] : null;
  const code = err?.code || nested?.code;
  if (code && REDIS_UNREACHABLE_CODES.has(code)) return true;
  const msg = String(err?.message || "");
  return /enableOfflineQueue|Stream isn't writeable|writable|writeable|Connection is closed/i.test(msg);
}

function parseSocketOrigins() {
  const list = [];
  for (const key of ["FRONTEND_URL", "MOBILE_URL"]) {
    const raw = String(process.env[key] || "").trim();
    if (!raw) continue;
    try {
      list.push(new URL(raw).origin);
    } catch {
      list.push(raw.replace(/\/$/, ""));
    }
  }
  if (process.env.NODE_ENV !== "production") {
    list.push(
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "http://10.0.2.2:8081",
      "http://10.0.2.2:4000",
      "http://localhost:4000",
    );
  }
  return [...new Set(list)].filter(Boolean);
}

/** RN / some clients omit `handshake.auth`; also accept Bearer header and `?token=` (polling). */
function readHandshakeAccessToken(socket) {
  const authTok = socket.handshake.auth?.token;
  if (typeof authTok === "string" && authTok.trim()) return authTok.trim();

  const header = socket.handshake.headers?.authorization;
  if (typeof header === "string") {
    const bearer = header.replace(/^Bearer\s+/i, "").trim();
    if (bearer) return bearer;
  }

  const q = socket.handshake.query?.token;
  if (typeof q === "string" && q.trim()) return q.trim();
  if (Array.isArray(q) && q[0] && typeof q[0] === "string" && q[0].trim()) return q[0].trim();

  return null;
}

function validateLocationPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const lat = Number(payload.latitude);
  const lng = Number(payload.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return null;
  const accuracy =
    payload.accuracy != null && Number.isFinite(Number(payload.accuracy))
      ? Number(payload.accuracy)
      : undefined;
  return { latitude: lat, longitude: lng, accuracy };
}

function getDeliveryAgentRoom(deliveryAgentId) {
  return `${DELIVERY_AGENT_ROOM_PREFIX}${deliveryAgentId}`;
}

/**
 * Attach Socket.IO for delivery live location. Redis persists latest coords when REDIS_URL is set.
 * @param {import("http").Server} httpServer
 */
function attachDeliveryLocationSocket(httpServer) {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  let redis = null;
  if (redisUrl) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy() {
        return null;
      },
    });
    redis.on("error", (err) => {
      const nested = Array.isArray(err?.errors) ? err.errors[0] : null;
      const code = err?.code || nested?.code || "ERR";
      // eslint-disable-next-line no-console
      console.warn(
        "[redis] %s — optional persistence skipped. Unset REDIS_URL or start Redis; Socket.IO is unchanged.",
        code,
      );
      if (REDIS_UNREACHABLE_CODES.has(code)) {
        try {
          redis.disconnect(false);
        } catch {
          /* ignore */
        }
        redis = null;
      }
    });
    void redis.connect().catch(() => {});
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      "REDIS_URL is not set: delivery locations are broadcast over Socket.IO only (not stored in Redis).",
    );
  }

  const origins = parseSocketOrigins();

  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }
        if (origins.length === 0) {
          return callback(null, process.env.NODE_ENV !== "production");
        }
        if (origins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = readHandshakeAccessToken(socket);
    const user = await resolveUserFromAccessToken(token);
    if (!user) {
      return next(new Error("Unauthorized"));
    }
    socket.data.user = user;
    return next();
  });

  io.on("connection", (socket) => {
    const { user } = socket.data;
    const customerTrackingRooms = new Set();

    socket.on("subscribe:delivery-locations", () => {
      if (WATCHER_ROLES.has(user.role)) {
        socket.join(DELIVERY_WATCHERS_ROOM);
      }
    });

    socket.on("subscribe:customer-order-tracking", async (payload, ack) => {
      if (user.role !== "Customer") {
        if (typeof ack === "function") ack({ ok: false, error: "Forbidden" });
        return;
      }
      const orderId = String(payload?.orderId || "").trim();
      if (!orderId) {
        if (typeof ack === "function") ack({ ok: false, error: "Missing orderId" });
        return;
      }
      const customer = await customerRepository.getCustomerByUserId(user.sub);
      if (!customer) {
        if (typeof ack === "function") ack({ ok: false, error: "Customer profile not found" });
        return;
      }
      const order = await orderRepository.getOrderById(orderId);
      if (!order) {
        if (typeof ack === "function") ack({ ok: false, error: "Order not found" });
        return;
      }
      if (String(order.customerId) !== String(customer.id)) {
        if (typeof ack === "function") ack({ ok: false, error: "Forbidden" });
        return;
      }
      if (order.status !== "Ready_For_Delivery") {
        if (typeof ack === "function") {
          ack({ ok: false, error: "Tracking available only at Ready_For_Delivery" });
        }
        return;
      }
      if (!order.deliveryAgentId) {
        if (typeof ack === "function") ack({ ok: false, error: "Delivery agent is not assigned" });
        return;
      }

      for (const room of customerTrackingRooms) {
        socket.leave(room);
      }
      customerTrackingRooms.clear();

      const room = getDeliveryAgentRoom(order.deliveryAgentId);
      socket.join(room);
      customerTrackingRooms.add(room);
      if (typeof ack === "function") ack({ ok: true, room });
    });

    socket.on("delivery:location", async (payload, ack) => {
      if (user.role !== "Delivery") {
        if (typeof ack === "function") ack({ ok: false, error: "Forbidden" });
        return;
      }
      const agentId =
        user.deliveryAgentId != null && String(user.deliveryAgentId).trim() !== ""
          ? String(user.deliveryAgentId)
          : "";
      if (!agentId) {
        if (typeof ack === "function") {
          ack({ ok: false, error: "Delivery account is not linked to a delivery agent" });
        }
        return;
      }
      const allOrders = await orderRepository.listOrders();
      const hasActiveDeliveryOrder = allOrders.some(
        (order) =>
          String(order.deliveryAgentId || "") === agentId && order.status === "Ready_For_Delivery",
      );
      if (!hasActiveDeliveryOrder) {
        if (typeof ack === "function") {
          ack({ ok: false, error: "Tracking is available only for Ready_For_Delivery orders" });
        }
        return;
      }
      const loc = validateLocationPayload(payload);
      if (!loc) {
        if (typeof ack === "function") ack({ ok: false, error: "Invalid coordinates" });
        return;
      }
      const updatedAt = new Date().toISOString();
      const body = {
        userId: user.sub,
        name: user.name,
        username: user.username,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        updatedAt,
      };
      if (redis && redis.status === "ready") {
        try {
          const key = `dms:delivery:location:${agentId}`;
          await redis.set(key, JSON.stringify(body), "EX", DELIVERY_LOCATION_TTL_SEC);
        } catch (err) {
          if (!isOptionalRedisPersistenceNoise(err)) {
            const nested = Array.isArray(err?.errors) ? err.errors[0] : null;
            const code = err?.code || nested?.code;
            // eslint-disable-next-line no-console
            console.warn("[redis] set failed: %s", code || err?.message || err);
          }
        }
      }
      io.to(DELIVERY_WATCHERS_ROOM).emit("delivery:location", body);
      io.to(getDeliveryAgentRoom(agentId)).emit("delivery:location", body);
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("disconnect", () => {
      customerTrackingRooms.clear();
    });
  });

  async function shutdown() {
    await io.close();
    if (redis) {
      redis.disconnect();
    }
  }

  return { io, redis, shutdown };
}

module.exports = { attachDeliveryLocationSocket, DELIVERY_WATCHERS_ROOM };
