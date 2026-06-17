const http = require("http");
const { loadEnv, validateEnv } = require("./config/env");
const { checkDbConnection } = require("../database/pool");
const { ensureSchema } = require("../database/ensureSchema");
const { attachDeliveryLocationSocket } = require("./socket/deliveryLocationSocket");

loadEnv();
const app = require("./app");

async function start() {
  validateEnv();
  await checkDbConnection();
  await ensureSchema();

  const port = Number(process.env.PORT || 4000);
  const server = http.createServer(app);

  const socketLayer = attachDeliveryLocationSocket(server);
  const { shutdown } = socketLayer;

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${port}`);
  });

  async function onShutdown(signal) {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, closing server…`);
    await new Promise((resolve) => server.close(resolve));
    await shutdown().catch(() => {});
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
