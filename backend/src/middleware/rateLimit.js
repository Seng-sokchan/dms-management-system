const rateLimit = require("express-rate-limit");

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const apiRateLimit = rateLimit({
  windowMs: toPositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toPositiveInt(process.env.API_RATE_LIMIT_MAX, 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const authLoginRateLimit = rateLimit({
  windowMs: toPositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

module.exports = {
  apiRateLimit,
  authLoginRateLimit,
};
