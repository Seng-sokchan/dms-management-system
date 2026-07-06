function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const CHECKOUT_TTL_MINUTES = toPositiveInt(process.env.PAYMENT_CHECKOUT_TTL_MINUTES, 5);
const CHECKOUT_TTL_MS = CHECKOUT_TTL_MINUTES * 60 * 1000;
const CHECKOUT_TTL_SEC = CHECKOUT_TTL_MINUTES * 60;

module.exports = {
  CHECKOUT_TTL_MINUTES,
  CHECKOUT_TTL_MS,
  CHECKOUT_TTL_SEC,
};
