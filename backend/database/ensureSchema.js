const { getPool } = require("./pool");
const { backfillOrderMasters } = require("./backfillOrderMasters");
const { readRuntimeUpgradeSql } = require("./schemaLoader");

/** Apply idempotent runtime schema upgrades on server startup. */
async function ensureSchema() {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(readRuntimeUpgradeSql());
    const backfilled = await backfillOrderMasters(conn);
    if (backfilled > 0) {
      // eslint-disable-next-line no-console
      console.log(`[schema] backfilled order_id on ${backfilled} detail row(s)`);
    }
  } finally {
    conn.release();
  }
}

module.exports = { ensureSchema };
