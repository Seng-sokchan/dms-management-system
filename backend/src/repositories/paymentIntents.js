const { getPool } = require("../../database/pool");

function mapIntentRow(row, channel) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: String(row.order_id),
    customerId: String(row.customer_id),
    paywayTranId: row.payway_tran_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: "pending",
    channel,
    checkoutUrl: row.checkout_url || row.qr_image_url || null,
    deeplinkUrl: row.deeplink_url || null,
    qrString: row.qr_string || null,
    expiresAt: row.expires_at,
    returnParams: row.return_params,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isKhqrOption(paymentOption) {
  return String(paymentOption || "").toLowerCase().includes("khqr");
}

async function insertAbaIntent(row, executor) {
  const db = executor || getPool();
  await db.query(
    `INSERT INTO payment_with_aba (
      id, order_id, customer_id, payway_tran_id, amount, currency,
      deeplink_url, checkout_url, raw_create_response, return_params,
      expires_at, idempotency_key, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      row.id,
      row.orderId,
      row.customerId,
      row.paywayTranId,
      row.amount,
      row.currency,
      row.deeplinkUrl,
      row.checkoutUrl,
      row.rawCreateResponse ? JSON.stringify(row.rawCreateResponse) : null,
      row.returnParams || null,
      row.expiresAt,
      row.idempotencyKey,
    ],
  );
  return getIntentById(row.id, db);
}

async function insertKhqrIntent(row, executor) {
  const db = executor || getPool();
  await db.query(
    `INSERT INTO payment_with_khqr (
      id, order_id, customer_id, payway_tran_id, amount, currency,
      qr_string, qr_image_url, raw_create_response, return_params,
      expires_at, idempotency_key, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      row.id,
      row.orderId,
      row.customerId,
      row.paywayTranId,
      row.amount,
      row.currency,
      row.qrString || null,
      row.qrImageUrl || null,
      row.rawCreateResponse ? JSON.stringify(row.rawCreateResponse) : null,
      row.returnParams || null,
      row.expiresAt,
      row.idempotencyKey,
    ],
  );
  return getIntentById(row.id, db);
}

async function getAbaIntentById(id, executor) {
  const db = executor || getPool();
  const [rows] = await db.query("SELECT * FROM payment_with_aba WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapIntentRow(rows[0], "aba") : null;
}

async function getKhqrIntentById(id, executor) {
  const db = executor || getPool();
  const [rows] = await db.query("SELECT * FROM payment_with_khqr WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapIntentRow(rows[0], "khqr") : null;
}

async function getIntentById(id, executor) {
  const aba = await getAbaIntentById(id, executor);
  if (aba) return aba;
  return getKhqrIntentById(id, executor);
}

async function getIntentByPaywayTranId(tranId, executor) {
  const db = executor || getPool();
  const [abaRows] = await db.query(
    "SELECT * FROM payment_with_aba WHERE payway_tran_id = ? LIMIT 1",
    [tranId],
  );
  if (abaRows[0]) return mapIntentRow(abaRows[0], "aba");
  const [khqrRows] = await db.query(
    "SELECT * FROM payment_with_khqr WHERE payway_tran_id = ? LIMIT 1",
    [tranId],
  );
  if (khqrRows[0]) return mapIntentRow(khqrRows[0], "khqr");
  return null;
}

async function findPendingIntentByMasterOrderId(masterOrderId, executor) {
  const db = executor || getPool();
  const [abaRows] = await db.query(
    `SELECT * FROM payment_with_aba
     WHERE order_id = ? AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [masterOrderId],
  );
  if (abaRows[0]) return mapIntentRow(abaRows[0], "aba");
  const [khqrRows] = await db.query(
    `SELECT * FROM payment_with_khqr
     WHERE order_id = ? AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [masterOrderId],
  );
  if (khqrRows[0]) return mapIntentRow(khqrRows[0], "khqr");
  return null;
}

async function findPendingIntentByDepotBatchId(depotBatchId, executor) {
  const db = executor || getPool();
  const [abaRows] = await db.query(
    `SELECT a.* FROM payment_with_aba a
     INNER JOIN orders o ON o.id = a.order_id
     WHERE o.depot_batch_id = ? AND a.expires_at > NOW()
     ORDER BY a.created_at DESC LIMIT 1`,
    [String(depotBatchId)],
  );
  if (abaRows[0]) return mapIntentRow(abaRows[0], "aba");
  const [khqrRows] = await db.query(
    `SELECT k.* FROM payment_with_khqr k
     INNER JOIN orders o ON o.id = k.order_id
     WHERE o.depot_batch_id = ? AND k.expires_at > NOW()
     ORDER BY k.created_at DESC LIMIT 1`,
    [String(depotBatchId)],
  );
  if (khqrRows[0]) return mapIntentRow(khqrRows[0], "khqr");
  return null;
}

async function deleteIntentById(id, executor) {
  const db = executor || getPool();
  const [aba] = await db.query("DELETE FROM payment_with_aba WHERE id = ?", [id]);
  if (aba.affectedRows > 0) return true;
  const [khqr] = await db.query("DELETE FROM payment_with_khqr WHERE id = ?", [id]);
  return khqr.affectedRows > 0;
}

async function expirePendingIntents(executor) {
  const db = executor || getPool();
  await db.query("DELETE FROM payment_with_aba WHERE expires_at <= NOW()");
  await db.query("DELETE FROM payment_with_khqr WHERE expires_at <= NOW()");
}

async function listStuckPendingIntents(limit = 50, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    `(SELECT id, 'aba' AS channel, payway_tran_id, order_id, created_at
      FROM payment_with_aba
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE))
     UNION ALL
     (SELECT id, 'khqr' AS channel, payway_tran_id, order_id, created_at
      FROM payment_with_khqr
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE))
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit],
  );
  const intents = [];
  for (const row of rows) {
    const intent = await getIntentById(row.id, db);
    if (intent) intents.push(intent);
  }
  return intents;
}

module.exports = {
  isKhqrOption,
  insertAbaIntent,
  insertKhqrIntent,
  getIntentById,
  getIntentByPaywayTranId,
  findPendingIntentByMasterOrderId,
  findPendingIntentByDepotBatchId,
  deleteIntentById,
  expirePendingIntents,
  listStuckPendingIntents,
};
