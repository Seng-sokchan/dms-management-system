const { createApp } = require("./app");
require("dotenv").config();
const { checkDbConnection } = require("./db/pool");

const app = createApp();

async function start() {
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
