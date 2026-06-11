const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");
const { ensurePaywaySchema } = require("./ensurePaywaySchema");
const { ensureDeliveryQtySchema } = require("./ensureDeliveryQtySchema");
const { backfillDepotBatchIds } = require("./backfillDepotBatchIds");

const UPGRADE_SQL = path.join(__dirname, "../../db/depot_batch_payment_schema_upgrade.sql");

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function procedureSelectsDepotBatchId(conn) {
  try {
    const [proc] = await conn.query("SHOW CREATE PROCEDURE sp_list_orders");
    const def = proc[0]?.["Create Procedure"] || "";
    return def.includes("depot_batch_id");
  } catch {
    return false;
  }
}

/**
 * Ensure depot_batch_id on orders, payment_orders junction, and list-order SPs (idempotent).
 */
async function ensureDepotBatchPaymentSchema() {
  await ensurePaywaySchema();
  await ensureDeliveryQtySchema();

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const hasBatchId = await columnExists(conn, "orders", "depot_batch_id");
    const hasPaymentOrders = await tableExists(conn, "payment_orders");
    const spIncludesBatchId = hasBatchId ? await procedureSelectsDepotBatchId(conn) : false;

    if (!hasBatchId || !hasPaymentOrders || !spIncludesBatchId) {
      const sql = fs.readFileSync(UPGRADE_SQL, "utf8");
      await conn.query(sql);
      // eslint-disable-next-line no-console
      console.log("[depot-batch-payment-schema] applied depot_batch_payment_schema_upgrade.sql");
    }

    const backfilled = await backfillDepotBatchIds(conn);
    if (backfilled > 0) {
      // eslint-disable-next-line no-console
      console.log(`[depot-batch-payment-schema] backfilled depot_batch_id on ${backfilled} order(s)`);
    }
  } finally {
    conn.release();
  }
}

module.exports = { ensureDepotBatchPaymentSchema };
