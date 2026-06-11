const crypto = require("crypto");
const { getPool } = require("./pool");

/**
 * Assign depot_batch_id to legacy orders submitted in one transaction
 * (same created_at, 2+ rows, still null depot_batch_id).
 */
async function backfillDepotBatchIds(executor) {
  const db = executor || getPool();
  const [groups] = await db.query(
    `SELECT created_at, COUNT(*) AS cnt
     FROM orders
     WHERE depot_batch_id IS NULL
     GROUP BY created_at
     HAVING cnt >= 2`,
  );

  let updated = 0;
  for (const group of groups) {
    const batchId = crypto.randomUUID();
    const [result] = await db.query(
      `UPDATE orders SET depot_batch_id = ?
       WHERE created_at = ? AND depot_batch_id IS NULL`,
      [batchId, group.created_at],
    );
    updated += Number(result.affectedRows || 0);
  }
  return updated;
}

module.exports = { backfillDepotBatchIds };
