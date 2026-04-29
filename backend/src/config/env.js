/**
 * Environment variable loader & validator.
 * Centralizes process.env access so the rest of the codebase can rely on a
 * typed, validated config object instead of touching process.env directly.
 *
 * Usage:
 *   const { env } = require("./config/env");
 *   const port = env.PORT;
 */
require("dotenv").config();

const REQUIRED = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME"];

function validate() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

validate();

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),

  // Database
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS || process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "12h",

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Bakong / KHQR (optional)
  BAKONG_TOKEN: process.env.BAKONG_TOKEN || "",
  BAKONG_MERCHANT_ID: process.env.BAKONG_MERCHANT_ID || "",
  BAKONG_MERCHANT_NAME: process.env.BAKONG_MERCHANT_NAME || "",
  BAKONG_MERCHANT_CITY: process.env.BAKONG_MERCHANT_CITY || "",
});

function isProduction() {
  return env.NODE_ENV === "production";
}

module.exports = { env, isProduction };
