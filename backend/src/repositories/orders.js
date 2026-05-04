const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapOrder } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");
const { getStatusIdByName } = require("./lookups");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function listOrders() {
  const [rows] = await getPool().query("CALL sp_list_orders()");
  return unwrapProcedureRows(rows).map(mapOrder);
}

async function getOrderById(id, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query("CALL sp_get_order_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapOrder(resultRows[0]) : null;
}

async function createOrder(payload) {
  const order = {
    ...payload,
    amountTotal: payload.orderedQty * payload.unitPrice,
    status: "New_Order",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const itemId = Number(order.itemId);
  const customerId = Number(order.customerId);
  const addressId = Number(order.addressId);
  const producerId = order.producerId ? Number(order.producerId) : null;
  const truckId = order.truckId ? Number(order.truckId) : null;
  const statusId = await getStatusIdByName(order.status);
  if (!statusId) {
    throw new Error("Status not found");
  }
  const [rowsRaw] = await getPool().query("CALL sp_create_order(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    customerId,
    addressId,
    itemId,
    order.orderedQty,
    order.unitPrice,
    order.currency || "USD",
    producerId,
    truckId,
    order.amountTotal,
    statusId,
    order.updatedAt,
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getOrderById(meta.insertId);
}

async function updateOrderAssignment(id, payload) {
  const order = await getOrderById(id);
  if (!order) return null;
  let nextStatus = order.status;
  if (payload.producerId !== undefined && payload.producerId !== null) {
    nextStatus = "Owner Preparing";
  }
  if (payload.truckId !== undefined && payload.truckId !== null) {
    nextStatus = "Owner Preparing";
  }
  const statusId = await getStatusIdByName(nextStatus);
  await getPool().query("CALL sp_update_order_assignment(?, ?, ?, ?, ?, ?, ?)", [
    id,
    payload.producerId ?? null,
    payload.truckId ?? null,
    payload.orderGroupId ?? null,
    payload.deliveryTime ?? null,
    statusId ?? null,
    nowIso(),
  ]);
  return getOrderById(id);
}

async function updateOrderStatus(id, status, { changedByUserId = null, note = "" } = {}) {
  const before = await getOrderById(id);
  if (!before) return null;
  const fromStatusId = await getStatusIdByName(before.status);
  const toStatusId = await getStatusIdByName(status);
  if (!toStatusId) {
    throw new Error("Status not found");
  }
  await getPool().query("CALL sp_update_order_status(?, ?, ?)", [id, toStatusId, nowIso()]);
  await getPool().query("CALL sp_insert_order_status_history(?, ?, ?, ?, ?)", [
    id, fromStatusId, toStatusId, changedByUserId, note || "",
  ]);
  return getOrderById(id);
}

async function confirmOrderDelivery(id) {
  const order = await getOrderById(id);
  if (!order) return null;
  const nextStatus = "Recieve_By_Customer";
  const nextStatusId = await getStatusIdByName(nextStatus);
  if (!nextStatusId) {
    throw new Error("Status not found");
  }
  await getPool().query("CALL sp_confirm_order_delivery(?, ?, ?)", [id, nextStatusId, nowIso()]);
  return getOrderById(id);
}

async function deleteOrder(id) {
  const order = await getOrderById(id);
  if (!order) return { affectedRows: 0, order: null };
  const [rowsRaw] = await getPool().query("CALL sp_delete_order(?)", [id]);
  const meta = getProcedureMeta(rowsRaw);
  return { affectedRows: Number(meta.affectedRows || 0), order };
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderAssignment,
  updateOrderStatus,
  confirmOrderDelivery,
  deleteOrder,
};
