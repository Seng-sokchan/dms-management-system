const http = require("http");
require("dotenv").config();
const { checkDbConnection } = require("../database/pool");
const { ensureRulesSchema } = require("../database/ensureRulesSchema");
const { attachDeliveryLocationSocket } = require("./socket/deliveryLocationSocket");
const { startPaymentStatusPoller, stopPaymentStatusPoller } = require("./jobs/paymentStatusPoller");
const { shutdownRedis } = require("./redis/client");

const REQUIRED_ENV_KEYS = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME"];

function validateEnv() {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !String(process.env[key] || "").trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

const app = require("./app");

const { refreshRulesCache } = require("./services/rulesCache");

async function start() {
  validateEnv();
  await checkDbConnection();
  await ensureRulesSchema();
  await refreshRulesCache();

  const port = Number(process.env.PORT || 4000);
  const server = http.createServer(app);

  const socketLayer = attachDeliveryLocationSocket(server);
  const { shutdown } = socketLayer;

  startPaymentStatusPoller();

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${port}`);
  });

  async function onShutdown(signal) {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, closing server…`);
    await new Promise((resolve) => server.close(resolve));
    stopPaymentStatusPoller();
    await shutdown().catch(() => {});
    shutdownRedis();
    process.exit(0);
  }

  process.once("SIGTERM", () => void onShutdown("SIGTERM"));
  process.once("SIGINT", () => void onShutdown("SIGINT"));
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
