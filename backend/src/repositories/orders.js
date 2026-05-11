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
    order.currency || "KHR",
    producerId,
    order.amountTotal,
    statusId,
    order.updatedAt,
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getOrderById(meta.insertId);
}

function toSqlIntOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function updateOrderAssignment(id, payload) {
  const order = await getOrderById(id);
  if (!order) return null;

  let mergedProducerId = payload.producerId !== undefined ? payload.producerId : order.producerId;
  let mergedOrderGroupId = payload.orderGroupId !== undefined ? payload.orderGroupId : order.orderGroupId;
  let mergedDeliveryTime = payload.deliveryTime !== undefined ? payload.deliveryTime : order.deliveryTime;
  let mergedDeliveryAgentId =
    payload.deliveryAgentId !== undefined ? payload.deliveryAgentId : order.deliveryAgentId;

  if (payload.deliveryAgentId !== undefined) {
    const raw = payload.deliveryAgentId;
    mergedDeliveryAgentId =
      raw !== null && raw !== undefined && String(raw).trim() !== "" ? raw : null;
  }

  let nextStatus = order.status;
  if (payload.producerId !== undefined && payload.producerId !== null && String(payload.producerId).trim() !== "") {
    nextStatus = "Owner_Preparing";
  }
  if (payload.deliveryAgentId !== undefined && mergedDeliveryAgentId !== null) {
    nextStatus = "Owner_Preparing";
  }

  const statusId = await getStatusIdByName(nextStatus);
  if (!statusId) {
    throw new Error("Status not found");
  }

  await getPool().query("CALL sp_update_order_assignment(?, ?, ?, ?, ?, ?, ?)", [
    id,
    toSqlIntOrNull(mergedProducerId),
    toSqlIntOrNull(mergedOrderGroupId),
    mergedDeliveryTime ?? null,
    toSqlIntOrNull(mergedDeliveryAgentId),
    statusId,
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
    id,
    fromStatusId,
    toStatusId,
    changedByUserId,
    note || "",
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
