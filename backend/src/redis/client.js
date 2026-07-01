const Redis = require("ioredis");
const { createMemoryAdapter } = require("./memoryAdapter");

const REDIS_UNREACHABLE_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN"]);

/** @type {"redis" | "memory" | null} */
let storeMode = null;
let client = null;
let memoryClient = null;
let memoryFallbackWarned = false;

function warnMemoryFallback(reason) {
  if (memoryFallbackWarned) return;
  memoryFallbackWarned = true;
  // eslint-disable-next-line no-console
  console.warn(
    `[redis] ${reason} — using in-memory checkout store (local/single-instance only; start Redis for production).`,
  );
}

function activateMemoryFallback(reason) {
  storeMode = "memory";
  warnMemoryFallback(reason);
}

function getMemoryClient() {
  if (!memoryClient) memoryClient = createMemoryAdapter();
  return memoryClient;
}

function abandonRedisClient() {
  if (!client) return;
  try {
    client.removeAllListeners();
    client.disconnect(false);
  } catch {
    /* ignore */
  }
  client = null;
}

function createClient() {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  if (!redisUrl) return null;

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy() {
      return null;
    },
  });

  redis.on("error", (err) => {
    if (storeMode === "memory") return;
    const nested = Array.isArray(err?.errors) ? err.errors[0] : null;
    const code = err?.code || nested?.code || "ERR";
    if (!REDIS_UNREACHABLE_CODES.has(code)) return;
    abandonRedisClient();
    activateMemoryFallback(`unreachable (${code})`);
  });

  return redis;
}

function getRedisClient() {
  if (storeMode === "memory") return null;
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  if (!redisUrl) return null;
  if (!client) client = createClient();
  return client;
}

async function ensureConnected() {
  if (storeMode === "memory") return getMemoryClient();

  const redisUrl = String(process.env.REDIS_URL || "").trim();
  if (!redisUrl) {
    activateMemoryFallback("REDIS_URL is not set");
    return getMemoryClient();
  }

  if (storeMode === "redis" && client?.status === "ready") return client;

  const redis = getRedisClient();
  if (!redis) {
    activateMemoryFallback("REDIS_URL is not set");
    return getMemoryClient();
  }

  if (redis.status === "ready") {
    storeMode = "redis";
    return redis;
  }

  try {
    await redis.connect();
  } catch (err) {
    abandonRedisClient();
    activateMemoryFallback(`cannot connect (${err.code || err.message})`);
    return getMemoryClient();
  }

  if (redis.status === "ready") {
    storeMode = "redis";
    return redis;
  }

  abandonRedisClient();
  activateMemoryFallback("connection not ready");
  return getMemoryClient();
}

function shutdownRedis() {
  abandonRedisClient();
  storeMode = null;
  memoryClient = null;
  memoryFallbackWarned = false;
}

module.exports = {
  getRedisClient,
  ensureConnected,
  shutdownRedis,
};
