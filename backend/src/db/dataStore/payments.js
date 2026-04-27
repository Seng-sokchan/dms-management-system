const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapPayment } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");
const { getOrderById } = require("./orders");
const { getStatusIdByName, getPaymentStatusIdByName } = require("./lookups");

async function listPayments() {
  const [rows] = await getPool().query("CALL sp_list_payments()");
  return unwrapProcedureRows(rows).map(mapPayment);
}

async function listPaymentMethods() {
  const [rows] = await getPool().query(
    `SELECT id, name
     FROM payment_methods
     ORDER BY id ASC`,
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
  }));
}

async function createPayment(payload) {
  const [result] = await getPool().query(
    "INSERT INTO payments (order_id, amount, method, note) VALUES (?, ?, ?, ?)",
    [Number(payload.orderId), payload.amount, Number(payload.method), payload.note || ""],
  );
  const [rows] = await getPool().query("CALL sp_get_payment_by_id(?)", [result.insertId]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapPayment(resultRows[0]) : null;
}

async function applyPaymentToOrder(orderId, amount) {
  const order = await getOrderById(orderId);
  if (!order) return null;
  const amountPaid = Math.min(order.amountTotal, order.amountPaid + amount);
  let paymentStatus = "UNPAID";
  if (amountPaid >= order.amountTotal) {
    paymentStatus = "PAID";
  }
  const paymentStatusId = await getPaymentStatusIdByName(paymentStatus);
  if (!paymentStatusId) {
    throw new Error("Payment status not found");
  }
  await getPool().query(
    "UPDATE orders SET amount_paid = ?, payment_status = ?, status = ?, updated_at = ? WHERE id = ?",
    [amountPaid, paymentStatusId, await getStatusIdByName(order.status), nowIso(), orderId],
  );
  return getOrderById(orderId);
}

module.exports = {
  listPayments,
  listPaymentMethods,
  createPayment,
  applyPaymentToOrder,
};
