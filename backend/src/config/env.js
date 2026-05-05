const REQUIRED_ENV_KEYS = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME"];

function loadEnv() {
  require("dotenv").config({ override: true });
}

function validateEnv(requiredKeys = REQUIRED_ENV_KEYS) {
  const missing = requiredKeys.filter((key) => !String(process.env[key] || "").trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

module.exports = {
  loadEnv,
  validateEnv,
  REQUIRED_ENV_KEYS,
};
