const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");

const UPGRADE_SQL = path.join(__dirname, "../../db/delivery_location_schema_upgrade.sql");

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

/** Ensure delivery_agent_locations exists (idempotent). */
async function ensureDeliveryLocationSchema() {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const exists = await tableExists(conn, "delivery_agent_locations");
    if (!exists) {
      const sql = fs.readFileSync(UPGRADE_SQL, "utf8");
      await conn.query(sql);
      // eslint-disable-next-line no-console
      console.log("[delivery-location-schema] applied delivery_location_schema_upgrade.sql");
    }
  } finally {
    conn.release();
  }
}

module.exports = { ensureDeliveryLocationSchema };
