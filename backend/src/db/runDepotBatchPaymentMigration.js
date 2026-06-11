/**
 * Apply depot batch payment schema upgrade.
 * Usage: node src/db/runDepotBatchPaymentMigration.js
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { loadEnv } = require("../config/env");
const { backfillDepotBatchIds } = require("./backfillDepotBatchIds");

loadEnv();

const UPGRADE_SQL = path.join(__dirname, "../../db/depot_batch_payment_schema_upgrade.sql");

async function run() {
  const sql = fs.readFileSync(UPGRADE_SQL, "utf8");

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
    const backfilled = await backfillDepotBatchIds(conn);
    // eslint-disable-next-line no-console
    console.log(`Depot batch payment schema upgrade applied to ${process.env.DB_NAME}`);
    if (backfilled > 0) {
      // eslint-disable-next-line no-console
      console.log(`Backfilled depot_batch_id on ${backfilled} legacy order(s)`);
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
