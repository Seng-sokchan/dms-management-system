const { getPool } = require("../../database/pool");

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: String(row.order_id),
    customerId: String(row.customer_id),
    provider: row.provider,
    paywayTranId: row.payway_tran_id,
    providerTranId: row.provider_tran_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: "paid",
    verifiedAt: row.verified_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

async function insertPayment(row, executor) {
  const db = executor || getPool();
  await db.query(
    `INSERT INTO payments (
      id, order_id, customer_id, provider, payway_tran_id, provider_tran_id,
      amount, currency, raw_callback_payload, verified_at, paid_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.orderId,
      row.customerId,
      row.provider || "payway",
      row.paywayTranId,
      row.providerTranId || row.paywayTranId,
      row.amount,
      row.currency,
      row.rawCallbackPayload ? JSON.stringify(row.rawCallbackPayload) : null,
      row.verifiedAt || new Date(),
      row.paidAt || new Date(),
    ],
  );
  return getPaymentById(row.id, db);
}

async function getPaymentById(id, executor) {
  const db = executor || getPool();
  const [rows] = await db.query("SELECT * FROM payments WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapPayment(rows[0]) : null;
}

async function getPaymentByPaywayTranId(paywayTranId, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    "SELECT * FROM payments WHERE payway_tran_id = ? LIMIT 1",
    [paywayTranId],
  );
  return rows[0] ? mapPayment(rows[0]) : null;
}

async function hasPaidPaymentForMasterOrderId(masterOrderId, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    "SELECT 1 FROM payments WHERE order_id = ? LIMIT 1",
    [Number(masterOrderId)],
  );
  return rows.length > 0;
}

async function getLatestPaymentByMasterOrderId(masterOrderId, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    "SELECT * FROM payments WHERE order_id = ? ORDER BY paid_at DESC, created_at DESC LIMIT 1",
    [Number(masterOrderId)],
  );
  return rows[0] ? mapPayment(rows[0]) : null;
}

module.exports = {
  mapPayment,
  insertPayment,
  getPaymentById,
  getPaymentByPaywayTranId,
  hasPaidPaymentForMasterOrderId,
  getLatestPaymentByMasterOrderId,
};
