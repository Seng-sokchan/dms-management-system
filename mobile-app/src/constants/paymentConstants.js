function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const CHECKOUT_TTL_MINUTES = toPositiveInt(
  process.env.EXPO_PUBLIC_PAYMENT_CHECKOUT_TTL_MINUTES,
  5,
);

export const PAYMENT_INTENT_TTL_MS = CHECKOUT_TTL_MINUTES * 60 * 1000;
