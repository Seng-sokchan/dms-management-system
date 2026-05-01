const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapPayment } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");
const { getOrderById } = require("./orders");
const { getStatusIdByName, getPaymentStatusIdByName } = require("./lookups");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function listPayments() {
  const [rows] = await getPool().query("CALL sp_list_payments()");
  return unwrapProcedureRows(rows).map(mapPayment);
}

async function listPaymentMethods() {
  const [rowsRaw] = await getPool().query("CALL sp_list_payment_methods()");
  const rows = unwrapProcedureRows(rowsRaw);
  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
  }));
}

async function createPayment(payload, executor) {
  const db = resolveExecutor(executor);
  const [createRowsRaw] = await db.query("CALL sp_create_payment(?, ?, ?, ?)", [
    Number(payload.orderId), payload.amount, Number(payload.method), payload.note || "",
  ]);
  const meta = getProcedureMeta(createRowsRaw);
  const [rows] = await db.query("CALL sp_get_payment_by_id(?)", [meta.insertId]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapPayment(resultRows[0]) : null;
}

async function applyPaymentToOrder(orderId, amount, executor) {
  const db = resolveExecutor(executor);
  const order = await getOrderById(orderId, db);
  if (!order) return null;
  const amountPaid = Math.min(order.amountTotal, order.amountPaid + amount);
  let paymentStatus = "UNPAID";
  if (amountPaid >= order.amountTotal) {
    paymentStatus = "PAID";
  }
  const paymentStatusId = await getPaymentStatusIdByName(paymentStatus, db);
  if (!paymentStatusId) {
    throw new Error("Payment status not found");
  }
  await db.query("CALL sp_apply_payment_to_order(?, ?, ?, ?, ?)", [
    orderId, amountPaid, paymentStatusId, await getStatusIdByName(order.status, db), nowIso(),
  ]);
  return getOrderById(orderId, db);
}

module.exports = {
  listPayments,
  listPaymentMethods,
  createPayment,
  applyPaymentToOrder,
};
