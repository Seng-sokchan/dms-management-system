const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");

const DELIVERY_QTY_UPGRADE_SQL = path.join(__dirname, "../../db/delivery_qty_schema_upgrade.sql");

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

/**
 * Ensure orders.delivered_qty and orders.loss_qty exist (idempotent).
 */
async function ensureDeliveryQtySchema() {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const hasDelivered = await columnExists(conn, "orders", "delivered_qty");
    const hasLoss = await columnExists(conn, "orders", "loss_qty");
    if (!hasDelivered || !hasLoss) {
      const sql = fs.readFileSync(DELIVERY_QTY_UPGRADE_SQL, "utf8");
      await conn.query(sql);
      // eslint-disable-next-line no-console
      console.log("[delivery-qty-schema] applied delivery_qty_schema_upgrade.sql");
    }
  } finally {
    conn.release();
  }
}

module.exports = { ensureDeliveryQtySchema };
