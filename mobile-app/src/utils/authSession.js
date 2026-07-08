/**
 * Access-token helpers and unauthorized-session bridge for mobile auth.
 */

let unauthorizedHandler = null;
let unauthorizedInFlight = null;

function base64UrlToBase64(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  return pad ? normalized + "=".repeat(4 - pad) : normalized;
}

/**
 * Decode JWT payload without verifying signature (server verifies).
 * @param {string} token
 * @returns {Record<string, unknown>|null}
 */
export function decodeJwtPayload(token) {
  if (typeof token !== "string" || !token.trim()) return null;
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const json = globalThis.atob(base64UrlToBase64(parts[1]));
    const payload = JSON.parse(json);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} token
 * @param {number} [skewMs] treat token as expired this many ms early
 * @returns {boolean}
 */
export function isAccessTokenExpired(token, skewMs = 30_000) {
  const payload = decodeJwtPayload(token);
  if (!payload || payload.exp == null) return false;
  const expSec = Number(payload.exp);
  if (!Number.isFinite(expSec)) return false;
  return expSec * 1000 <= Date.now() + skewMs;
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isAccountInactiveError(error) {
  const code = error?.response?.data?.error?.code || error?.response?.data?.code;
  return String(code || "").toUpperCase() === "ACCOUNT_INACTIVE";
}

/**
 * @param {unknown} user
 * @returns {boolean}
 */
export function isUserInactive(user) {
  if (!user || typeof user !== "object") return false;
  if (user.isActive === false) return true;
  if (user.is_active === 0 || user.is_active === false) return true;
  return false;
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isUnauthorizedError(error) {
  const status = error?.response?.status;
  if (status === 401) return true;
  const code = error?.response?.data?.error?.code || error?.response?.data?.code;
  return String(code || "").toUpperCase() === "UNAUTHORIZED";
}

/**
 * Register handler invoked when session must be cleared (expired / 401).
 * @param {((reason?: string) => void|Promise<void>)|null} handler
 */
export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

/**
 * Trigger force-logout once; concurrent callers share the same promise.
 * @param {string} [reason]
 * @returns {Promise<void>}
 */
export async function notifyUnauthorized(reason = "unauthorized") {
  if (!unauthorizedHandler) return;
  if (unauthorizedInFlight) return unauthorizedInFlight;

  unauthorizedInFlight = Promise.resolve()
    .then(() => unauthorizedHandler(reason))
    .catch(() => {})
    .finally(() => {
      unauthorizedInFlight = null;
    });

  return unauthorizedInFlight;
}
