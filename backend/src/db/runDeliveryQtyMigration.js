/**
 * Apply delivery quantity schema upgrade.
 * Usage: node src/db/runDeliveryQtyMigration.js
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { loadEnv } = require("../config/env");

loadEnv();

const DELIVERY_QTY_UPGRADE_SQL = path.join(__dirname, "../../db/delivery_qty_schema_upgrade.sql");

async function run() {
  const sql = fs.readFileSync(DELIVERY_QTY_UPGRADE_SQL, "utf8");

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
    // eslint-disable-next-line no-console
    console.log(`Delivery qty schema upgrade applied to ${process.env.DB_NAME}`);
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Migration failed:", err.message);
  process.exit(1);
});
