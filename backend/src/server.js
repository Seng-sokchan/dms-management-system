const { loadEnv, validateEnv } = require("./config/env");
const { checkDbConnection } = require("./db/pool");

loadEnv();
const app = require("./app");

async function start() {
  validateEnv();
  await checkDbConnection();
  app.listen(Number(process.env.PORT || 4000), () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${Number(process.env.PORT)}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
