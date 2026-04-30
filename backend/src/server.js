require("dotenv").config();
const app = require("./app");
const { checkDbConnection } = require("./db/pool");

function validateRequiredEnv() {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }
}

async function start() {
  validateRequiredEnv();
  await checkDbConnection();
  app.listen(Number(process.env.PORT || 4000), () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${Number(process.env.PORT || 4000)}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
