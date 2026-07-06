const { ensureConnected } = require("../redis/client");
const { CHECKOUT_TTL_SEC } = require("../config/paymentConfig");

const STATUS_KEY_PREFIX = "payment:status:";
const WATCH_KEY_PREFIX = "payment:watch:";
const TRAN_KEY_PREFIX = "payment:tran:";
const ORDER_KEY_PREFIX = "payment:order:";
const BATCH_KEY_PREFIX = "payment:batch:";
const PENDING_SET_KEY = "payment:pending";
const RECONCILE_INTERVAL_MS = 5000;
const DEFAULT_TTL_SEC = CHECKOUT_TTL_SEC;
const EXPIRED_STATUS_TTL_SEC = 60;

const TERMINAL = new Set(["paid", "expired"]);

function statusKey(paymentId) {
  return `${STATUS_KEY_PREFIX}${paymentId}`;
}

function watchKey(paymentId) {
  return `${WATCH_KEY_PREFIX}${paymentId}`;
}

function tranKey(paywayTranId) {
  return `${TRAN_KEY_PREFIX}${paywayTranId}`;
}

function orderKey(masterOrderId) {
  return `${ORDER_KEY_PREFIX}${masterOrderId}`;
}

function batchKey(batchId) {
  return `${BATCH_KEY_PREFIX}${batchId}`;
}

function isSessionExpired(session) {
  if (!session?.expiresAt) return false;
  const expires = new Date(session.expiresAt);
  return Number.isFinite(expires.getTime()) && expires.getTime() <= Date.now();
}

function remainingTtlSec(session) {
  if (!session?.expiresAt) return DEFAULT_TTL_SEC;
  const expires = new Date(session.expiresAt);
  if (!Number.isFinite(expires.getTime())) return DEFAULT_TTL_SEC;
  const sec = Math.ceil((expires.getTime() - Date.now()) / 1000);
  return Math.max(0, Math.min(sec, DEFAULT_TTL_SEC));
}

function ttlSecondsForSession(session) {
  return remainingTtlSec(session);
}

function ttlSecondsForPayment(payment) {
  return DEFAULT_TTL_SEC;
}

function mapSessionRow(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    orderId: String(raw.orderId),
    customerId: String(raw.customerId),
    paywayTranId: raw.paywayTranId,
    amount: Number(raw.amount),
    currency: raw.currency,
    status: "unpaid",
    returnParams: raw.returnParams,
    expiresAt: raw.expiresAt,
    idempotencyKey: raw.idempotencyKey,
    batchId: raw.batchId || null,
    orderIds: raw.orderIds || null,
  };
}

async function requireRedis() {
  const redis = await ensureConnected();
  if (!redis) {
    const err = new Error("Payment session store is unavailable");
    err.status = 503;
    err.code = "SESSION_STORE_UNAVAILABLE";
    throw err;
  }
  return redis;
}

async function setStatus(paymentId, payload, ttlSec = DEFAULT_TTL_SEC) {
  const redis = await ensureConnected();
  if (!redis) return;
  const body = JSON.stringify({
    ...payload,
    updatedAt: Date.now(),
  });
  await redis.set(statusKey(paymentId), body, "EX", ttlSec);
}

async function getStatus(paymentId) {
  const redis = await ensureConnected();
  if (!redis) return null;
  try {
    const raw = await redis.get(statusKey(paymentId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Store checkout session in Redis (replaces MySQL payment_intents).
 */
async function saveCheckoutSession(session) {
  const redis = await requireRedis();
  if (!session?.id || !session?.paywayTranId) {
    throw new Error("Invalid checkout session");
  }

  const ttl = ttlSecondsForSession(session);
  if (ttl <= 0) {
    return mapSessionRow(session);
  }

  const payload = JSON.stringify(session);
  await redis.set(watchKey(session.id), payload, "EX", ttl);
  await redis.set(tranKey(session.paywayTranId), session.id, "EX", ttl);
  if (session.orderId) {
    await redis.set(orderKey(session.orderId), session.id, "EX", ttl);
  }
  if (session.batchId) {
    await redis.set(batchKey(session.batchId), session.id, "EX", ttl);
  }
  return mapSessionRow(session);
}

async function getCheckoutSession(paymentId) {
  const redis = await ensureConnected();
  if (!redis || !paymentId) return null;
  try {
    const raw = await redis.get(watchKey(paymentId));
    if (!raw) return null;
    return mapSessionRow(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function getCheckoutByPaywayTranId(paywayTranId) {
  const redis = await ensureConnected();
  if (!redis || !paywayTranId) return null;
  const paymentId = await redis.get(tranKey(paywayTranId));
  if (!paymentId) return null;
  return getCheckoutSession(paymentId);
}

async function findCheckoutByMasterOrderId(masterOrderId) {
  const redis = await ensureConnected();
  if (!redis || !masterOrderId) return null;
  const paymentId = await redis.get(orderKey(masterOrderId));
  if (!paymentId) return null;
  return getCheckoutSession(paymentId);
}

async function findCheckoutByBatchId(batchId) {
  const redis = await ensureConnected();
  if (!redis || !batchId) return null;
  const paymentId = await redis.get(batchKey(String(batchId)));
  if (!paymentId) return null;
  return getCheckoutSession(paymentId);
}

async function refreshCheckoutSessionTtl(session) {
  if (!session?.id || isSessionExpired(session)) return;
  await saveCheckoutSession(session);
}

/** Begin live KHQR polling for an existing Redis checkout session. */
async function startLiveCheck(session) {
  const redis = await requireRedis();
  if (!session?.id || isSessionExpired(session)) return false;

  const ttl = ttlSecondsForSession(session);
  if (ttl <= 0) return false;

  await setStatus(
    session.id,
    {
      status: "unpaid",
      paywayTranId: session.paywayTranId,
      orderId: session.orderId,
    },
    ttl,
  );
  await redis.sadd(PENDING_SET_KEY, session.id);
  await redis.expire(PENDING_SET_KEY, DEFAULT_TTL_SEC * 2);
  return true;
}

async function touchLiveCheck(session) {
  if (!session?.id || isSessionExpired(session)) return;
  await refreshCheckoutSessionTtl(session);
  await startLiveCheck(session);
}

async function isLiveCheckActive(paymentId) {
  const redis = await ensureConnected();
  if (!redis || !paymentId) return false;
  const active = await redis.sismember(PENDING_SET_KEY, paymentId);
  return active === 1;
}

/** Stop polling only; keep checkout session keys for PayWay webhook lookup until TTL. */
async function stopLiveCheck(paymentId) {
  const redis = await ensureConnected();
  if (!redis || !paymentId) return;
  await redis.del(statusKey(paymentId));
  await redis.srem(PENDING_SET_KEY, paymentId);
}

/** Stop live-check and mark session expired; keep tran/watch keys for webhook grace. */
async function expireCheckoutSession(paymentId) {
  const session = await getCheckoutSession(paymentId);
  if (!session) {
    await stopLiveCheck(paymentId);
    return;
  }

  await stopLiveCheck(paymentId);
  await setStatus(
    paymentId,
    {
      status: "expired",
      paywayTranId: session.paywayTranId,
      orderId: session.orderId,
    },
    EXPIRED_STATUS_TTL_SEC,
  );
}

async function setPaid(payment) {
  const redis = await ensureConnected();
  if (!payment?.id) return;
  await setStatus(
    payment.id,
    {
      status: "paid",
      paywayTranId: payment.paywayTranId,
      orderId: payment.orderId,
    },
    ttlSecondsForPayment(payment),
  );
  if (redis) {
    await redis.srem(PENDING_SET_KEY, payment.id);
  }
}

async function setFailed(paymentId) {
  await stopLiveCheck(paymentId);
}

/** Remove checkout session and all Redis indexes. */
async function removeCheckoutSession(paymentId) {
  const redis = await ensureConnected();
  if (!redis || !paymentId) return;

  const session = await getCheckoutSession(paymentId);
  await stopLiveCheck(paymentId);
  await redis.del(watchKey(paymentId));
  await redis.del(statusKey(paymentId));
  if (session?.paywayTranId) await redis.del(tranKey(session.paywayTranId));
  if (session?.orderId) await redis.del(orderKey(session.orderId));
  if (session?.batchId) await redis.del(batchKey(session.batchId));
}

async function remove(paymentId) {
  await removeCheckoutSession(paymentId);
}

async function shouldReconcile(paymentId) {
  if (!(await isLiveCheckActive(paymentId))) return false;
  const cached = await getStatus(paymentId);
  if (!cached) return true;
  if (TERMINAL.has(cached.status)) return false;
  const age = Date.now() - Number(cached.updatedAt || 0);
  return age >= RECONCILE_INTERVAL_MS;
}

async function listPendingIds(limit = 100) {
  const redis = await ensureConnected();
  if (!redis) return [];
  const ids = await redis.smembers(PENDING_SET_KEY);
  return ids.slice(0, limit);
}

module.exports = {
  RECONCILE_INTERVAL_MS,
  DEFAULT_TTL_SEC,
  isSessionExpired,
  remainingTtlSec,
  expireCheckoutSession,
  saveCheckoutSession,
  getCheckoutSession,
  getCheckoutByPaywayTranId,
  findCheckoutByMasterOrderId,
  findCheckoutByBatchId,
  startLiveCheck,
  touchLiveCheck,
  stopLiveCheck,
  isLiveCheckActive,
  getWatchIntent: getCheckoutSession,
  removeCheckoutSession,
  setPaid,
  setFailed,
  remove,
  getStatus,
  shouldReconcile,
  listPendingIds,
};
