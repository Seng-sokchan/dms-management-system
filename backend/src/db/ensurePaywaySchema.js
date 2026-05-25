const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");

const PAYWAY_UPGRADE_SQL = path.join(__dirname, "../../db/payway_schema_upgrade.sql");

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function columnAllowsNull(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT IS_NULLABLE FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName],
  );
  return rows[0]?.IS_NULLABLE === "YES";
}

/**
 * Ensure PayWay payments + webhook audit tables exist (idempotent).
 * Called on server start so production does not miss npm run db:migrate:payway.
 */
async function ensurePaywaySchema() {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const hasPayments = await tableExists(conn, "payments");
    const hasWebhooks = await tableExists(conn, "payment_webhook_events");
    const paymentIdNullable = hasWebhooks
      ? await columnAllowsNull(conn, "payment_webhook_events", "payment_id")
      : false;

    if (!hasPayments || !hasWebhooks || !paymentIdNullable) {
      const sql = fs.readFileSync(PAYWAY_UPGRADE_SQL, "utf8");
      await conn.query(sql);
      // eslint-disable-next-line no-console
      console.log("[payway-schema] applied payway_schema_upgrade.sql");
    }
  } finally {
    conn.release();
  }
}

module.exports = { ensurePaywaySchema };
