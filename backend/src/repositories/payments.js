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

/**
 * Unpaid master orders (no row in payments) for admin manual recording.
 */
async function listUnpaidMasterOrders(executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    `SELECT
       om.id AS master_order_id,
       om.order_no,
       om.target_type,
       om.created_at,
       CASE
         WHEN om.target_type = 2 THEN MAX(d.name)
         ELSE MAX(c.name)
       END AS party_name,
       MIN(od.customer_id) AS customer_id,
       COUNT(od.id) AS line_count,
       SUM(od.amount_total) AS amount_total,
       MIN(od.currency) AS currency,
       COUNT(DISTINCT od.currency) AS currency_count
     FROM orders om
     INNER JOIN order_details od ON od.order_id = om.id
     INNER JOIN customers c ON c.id = od.customer_id
     LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
     WHERE NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = om.id)
     GROUP BY om.id, om.order_no, om.target_type, om.created_at
     ORDER BY om.id DESC`,
  );
  return (rows || []).map((row) => ({
    masterOrderId: Number(row.master_order_id),
    orderNo: row.order_no != null ? String(row.order_no) : null,
    targetType: Number(row.target_type) === 2 ? 2 : 1,
    targetLabel: Number(row.target_type) === 2 ? "depot" : "customer",
    partyName: row.party_name || "—",
    customerId: row.customer_id != null ? String(row.customer_id) : null,
    lineCount: Number(row.line_count || 0),
    amountTotal: Number(row.amount_total || 0),
    currency: row.currency || "KHR",
    mixedCurrency: Number(row.currency_count || 0) > 1,
    createdAt: row.created_at,
  }));
}

module.exports = {
  mapPayment,
  insertPayment,
  getPaymentById,
  getPaymentByPaywayTranId,
  hasPaidPaymentForMasterOrderId,
  getLatestPaymentByMasterOrderId,
  listUnpaidMasterOrders,
};
