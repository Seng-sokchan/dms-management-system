/**
 * Apply schema runtime upgrades (views, tables, columns, order/payment model).
 * Usage: npm run db:migrate
 */
const mysql = require("mysql2/promise");
const { loadEnv } = require("../src/config/env");
const { backfillOrderMasters } = require("./backfillOrderMasters");
const { readRuntimeUpgradeSql } = require("./schemaLoader");

loadEnv();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await conn.query(readRuntimeUpgradeSql());
    const backfilled = await backfillOrderMasters(conn);
    // eslint-disable-next-line no-console
    console.log(`Schema runtime upgrade applied to ${process.env.DB_NAME}`);
    if (backfilled > 0) {
      // eslint-disable-next-line no-console
      console.log(`Backfilled order_id on ${backfilled} detail row(s)`);
    }
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Migration failed:", err.message);
  process.exit(1);
});
