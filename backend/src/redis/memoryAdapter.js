/**
 * In-process Redis-compatible store for checkout sessions when Redis is unavailable.
 * Suitable for local dev and single-instance deploys only.
 */
function createMemoryAdapter() {
  const strings = new Map();
  const sets = new Map();
  const timers = new Map();

  function clearTimer(key) {
    const t = timers.get(key);
    if (t) {
      clearTimeout(t);
      timers.delete(key);
    }
  }

  function isExpired(entry) {
    return entry?.expiresAt != null && entry.expiresAt <= Date.now();
  }

  function getString(key) {
    const entry = strings.get(key);
    if (!entry) return null;
    if (isExpired(entry)) {
      strings.delete(key);
      clearTimer(key);
      return null;
    }
    return entry.value;
  }

  function setString(key, value, ttlSec) {
    clearTimer(key);
    const expiresAt = ttlSec > 0 ? Date.now() + ttlSec * 1000 : null;
    strings.set(key, { value, expiresAt });
    if (expiresAt) {
      timers.set(
        key,
        setTimeout(() => {
          strings.delete(key);
          timers.delete(key);
        }, ttlSec * 1000),
      );
    }
  }

  function getSet(key) {
    if (!sets.has(key)) sets.set(key, new Set());
    return sets.get(key);
  }

  return {
    status: "ready",
    async connect() {},
    async get(key) {
      return getString(key);
    },
    async set(key, value, mode, ttlSec) {
      const ttl = mode === "EX" ? Number(ttlSec) : 0;
      setString(key, value, ttl);
      return "OK";
    },
    async del(...keys) {
      let removed = 0;
      for (const key of keys) {
        clearTimer(key);
        if (strings.delete(key)) removed += 1;
        if (sets.delete(key)) removed += 1;
      }
      return removed;
    },
    async sadd(key, member) {
      const set = getSet(key);
      const sizeBefore = set.size;
      set.add(String(member));
      return set.size > sizeBefore ? 1 : 0;
    },
    async srem(key, member) {
      const set = sets.get(key);
      if (!set) return 0;
      return set.delete(String(member)) ? 1 : 0;
    },
    async smembers(key) {
      const set = sets.get(key);
      return set ? [...set] : [];
    },
    async sismember(key, member) {
      const set = sets.get(key);
      return set?.has(String(member)) ? 1 : 0;
    },
    async expire(key, ttlSec) {
      const entry = strings.get(key);
      if (entry) {
        setString(key, entry.value, Number(ttlSec));
        return 1;
      }
      if (sets.has(key)) return 1;
      return 0;
    },
  };
}

module.exports = {
  createMemoryAdapter,
};
