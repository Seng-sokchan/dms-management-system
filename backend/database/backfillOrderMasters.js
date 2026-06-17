const crypto = require("node:crypto");

/**
 * Backfill master orders and order_details.order_id after orders→order_details rename.
 * One master per distinct depot_batch_id; singleton lines get their own master + UUID.
 */
async function backfillOrderMasters(conn) {
  if (!(await tableExists(conn, "order_details"))) return 0;

  const [detailCols] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'order_details' AND column_name = 'order_id'`,
  );
  if (!detailCols[0]?.cnt) return 0;

  const [unlinked] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM order_details WHERE order_id IS NULL",
  );
  if (Number(unlinked[0]?.cnt || 0) === 0) return 0;

  const hasDepotBatchCol = await columnExists(conn, "order_details", "depot_batch_id");

  if (hasDepotBatchCol) {
    const [batchGroups] = await conn.query(
      `SELECT depot_batch_id, MIN(created_at) AS created_at, MAX(updated_at) AS updated_at
       FROM order_details
       WHERE depot_batch_id IS NOT NULL AND order_id IS NULL
       GROUP BY depot_batch_id`,
    );
    for (const group of batchGroups) {
      const [result] = await conn.query(
        "INSERT INTO orders (depot_batch_id, created_at, updated_at) VALUES (?, ?, ?)",
        [group.depot_batch_id, group.created_at, group.updated_at || group.created_at],
      );
      const masterId = result.insertId;
      await conn.query(
        "UPDATE order_details SET order_id = ? WHERE depot_batch_id = ? AND order_id IS NULL",
        [masterId, group.depot_batch_id],
      );
    }
  }

  const depotBatchFilter = hasDepotBatchCol
    ? "depot_batch_id IS NULL AND order_id IS NULL"
    : "order_id IS NULL";
  const [singletons] = await conn.query(
    `SELECT id, created_at, updated_at FROM order_details WHERE ${depotBatchFilter}`,
  );

  for (const row of singletons) {
    const batchId = crypto.randomUUID();
    const [result] = await conn.query(
      "INSERT INTO orders (depot_batch_id, created_at, updated_at) VALUES (?, ?, ?)",
      [batchId, row.created_at, row.updated_at || row.created_at],
    );
    await conn.query("UPDATE order_details SET order_id = ? WHERE id = ?", [result.insertId, row.id]);
  }

  await conn.query("ALTER TABLE order_details MODIFY order_id INT UNSIGNED NOT NULL");

  await remapPaymentsOrderIds(conn);

  return Number(unlinked[0]?.cnt || 0);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function remapPaymentsOrderIds(conn) {
  const tables = ["payments", "payment_with_aba", "payment_with_khqr"];
  for (const table of tables) {
    const exists = await tableExists(conn, table);
    if (!exists) continue;

    await conn.query(
      `UPDATE ${table} pt
       INNER JOIN order_details od ON od.id = pt.order_id
       SET pt.order_id = od.order_id
       WHERE pt.order_id <> od.order_id`,
    );
  }
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

module.exports = { backfillOrderMasters, remapPaymentsOrderIds };
