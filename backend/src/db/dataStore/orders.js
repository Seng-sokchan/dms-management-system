const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapOrder } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");
const { getStatusIdByName, getPaymentStatusIdByName } = require("./lookups");
const { getTruckById } = require("./trucks");

async function listOrders() {
  const [rows] = await getPool().query("CALL sp_list_orders()");
  return unwrapProcedureRows(rows).map(mapOrder);
}

async function getOrderById(id) {
  const [rows] = await getPool().query("CALL sp_get_order_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapOrder(resultRows[0]) : null;
}

async function createOrder(payload) {
  const order = {
    ...payload,
    deliveredQty: 0,
    lossQty: 0,
    remainingQty: 0,
    discrepancy: 0,
    amountTotal: payload.orderedQty * payload.unitPrice,
    amountPaid: 0,
    paymentStatus: "UNPAID",
    status: "NEW_ORDER",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const itemId = Number(order.itemId);
  const customerId = Number(order.customerId);
  const addressId = Number(order.addressId);
  const producerId = order.producerId ? Number(order.producerId) : null;
  const truckId = order.truckId ? Number(order.truckId) : null;
  const truck = truckId ? await getTruckById(truckId) : null;
  const deliveryAgentId = truck?.deliveryAgentId ? Number(truck.deliveryAgentId) : null;
  const statusId = await getStatusIdByName(order.status);
  if (!statusId) {
    throw new Error("Status not found");
  }
  const [result] = await getPool().query(
    `INSERT INTO orders
    (customer_id, address, item_id, ordered_qty, unit_price, producer_id, truck_id, delivery_agent_id, delivery_time, delivered_qty, loss_qty, remaining_qty, discrepancy, amount_total, amount_paid, payment_status, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customerId,
      addressId,
      itemId,
      order.orderedQty,
      order.unitPrice,
      producerId,
      truckId,
      deliveryAgentId,
      null,
      order.deliveredQty,
      order.lossQty,
      order.remainingQty,
      order.discrepancy,
      order.amountTotal,
      order.amountPaid,
      await getPaymentStatusIdByName("UNPAID"),
      statusId,
      order.updatedAt,
    ],
  );
  return getOrderById(result.insertId);
}

async function updateOrderAssignment(id, payload) {
  const order = await getOrderById(id);
  if (!order) return null;
  let nextStatus = order.status;
  if (payload.producerId !== undefined && payload.producerId !== null) {
    nextStatus = "OWNER_PREPARING";
  }
  if (payload.truckId !== undefined && payload.truckId !== null) {
    nextStatus = "OWNER_PREPARING";
  }
  if (payload.deliveryAgentId !== undefined && payload.deliveryAgentId !== null) {
    nextStatus = "OWNER_PREPARING";
  }
  const truck = payload.truckId !== undefined && payload.truckId !== null
    ? await getTruckById(payload.truckId)
    : null;
  const resolvedDeliveryAgentId = truck?.deliveryAgentId
    ? Number(truck.deliveryAgentId)
    : (payload.deliveryAgentId ?? null);
  const statusId = await getStatusIdByName(nextStatus);
  await getPool().query(
    `UPDATE orders
     SET producer_id = COALESCE(?, producer_id),
         truck_id = COALESCE(?, truck_id),
         delivery_agent_id = COALESCE(?, delivery_agent_id),
         delivery_time = COALESCE(?, delivery_time),
         status = COALESCE(?, status),
         updated_at = ?
     WHERE id = ?`,
    [
      payload.producerId ?? null,
      payload.truckId ?? null,
      resolvedDeliveryAgentId,
      payload.deliveryTime ?? null,
      statusId ?? null,
      nowIso(),
      id,
    ],
  );
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
  await getPool().query("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", [toStatusId, nowIso(), id]);
  await getPool().query(
    "INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_user_id, note) VALUES (?, ?, ?, ?, ?)",
    [id, fromStatusId, toStatusId, changedByUserId, note || ""],
  );
  return getOrderById(id);
}

async function confirmOrderDelivery(id, deliveredQty, lossQty, remainingQty, deliveryProofType, deliveryProofValue) {
  const order = await getOrderById(id);
  if (!order) return null;
  const discrepancy = order.orderedQty - deliveredQty - lossQty - remainingQty;
  const nextStatus = "RECEIVED_BY_CUSTOMER";
  const nextStatusId = await getStatusIdByName(nextStatus);
  if (!nextStatusId) {
    throw new Error("Status not found");
  }
  await getPool().query(
    "UPDATE orders SET delivered_qty = ?, loss_qty = ?, remaining_qty = ?, discrepancy = ?, status = ?, delivery_proof_type = ?, delivery_proof_value = ?, updated_at = ? WHERE id = ?",
    [deliveredQty, lossQty, remainingQty, discrepancy, nextStatusId, deliveryProofType, deliveryProofValue, nowIso(), id],
  );
  return getOrderById(id);
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderAssignment,
  updateOrderStatus,
  confirmOrderDelivery,
};
