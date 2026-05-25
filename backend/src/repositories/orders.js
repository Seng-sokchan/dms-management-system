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

async function listFactoryNotificationOrdersByOrderId(id) {
  const [rows] = await getPool().query(
    `SELECT
       o.id,
       c.name AS customer_name,
       o.customer_id,
       o.item_id,
       o.currency,
       o.ordered_qty,
       o.unit_price,
       o.producer_id,
       o.delivery_agent_id,
       o.delivery_time,
       o.amount_total,
       s.name AS status,
       o.created_at,
       o.updated_at,
       c.phone AS customer_phone,
       c.province_id AS customer_province_id,
       pr.name AS customer_province_name,
       c.latitude AS customer_latitude,
       c.longitude AS customer_longitude,
       p.name AS producer_name,
       da.name AS delivery_agent_name,
       it.name AS item_name,
       it.sku AS item_sku
     FROM orders source
     INNER JOIN orders o ON (
       o.id = source.id
       OR (
         source.delivery_agent_id IS NOT NULL
         AND o.status = source.status
         AND o.delivery_agent_id = source.delivery_agent_id
       )
     )
     INNER JOIN customers c ON c.id = o.customer_id
     INNER JOIN items it ON it.id = o.item_id
     INNER JOIN status s ON s.id = o.status
     LEFT JOIN provinces pr ON pr.id = c.province_id AND pr.is_active = 1
     LEFT JOIN producers p ON p.id = o.producer_id
     LEFT JOIN delivery_agents da ON da.id = o.delivery_agent_id
     WHERE source.id = ?
     ORDER BY c.name, it.name, o.id`,
    [id],
  );
  return rows.map(mapOrder);
}

/** Terminal status name in DB: order is complete (delivered). */
const TERMINAL_ORDER_STATUS_NAME = "Recieve_By_Customer";

/**
 * Count orders for this customer that are not yet delivered (not terminal status).
 */
async function countNonTerminalOrdersByCustomer(customerId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM orders o
     INNER JOIN status s ON s.id = o.status
     WHERE o.customer_id = ? AND s.name <> ?`,
    [Number(customerId), TERMINAL_ORDER_STATUS_NAME],
  );
  return Number(rows[0]?.cnt || 0);
}

async function createOrder(payload, executor) {
  const db = resolveExecutor(executor);
  const order = {
    ...payload,
    amountTotal: payload.orderedQty * payload.unitPrice,
    status: "Owner_Preparing",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const itemId = Number(order.itemId);
  const customerId = Number(order.customerId);
  const producerId = order.producerId ? Number(order.producerId) : null;
  const statusId = await getStatusIdByName(order.status, executor);
  if (!statusId) {
    throw new Error("Status not found");
  }
  const [rowsRaw] = await db.query("CALL sp_create_order(?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    customerId,
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
  return getOrderById(meta.insertId, executor);
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

  await getPool().query("CALL sp_update_order_assignment(?, ?, ?, ?, ?, ?)", [
    id,
    toSqlIntOrNull(mergedProducerId),
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

async function updateOrderStatuses(ids, status, { changedByUserId = null, note = "" } = {}) {
  const uniqueIds = [...new Set((ids || []).map((id) => Number(id)).filter(Number.isFinite))];
  if (uniqueIds.length === 0) return [];

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const toStatusId = await getStatusIdByName(status, conn);
    if (!toStatusId) {
      throw new Error("Status not found");
    }

    const changedIds = [];
    for (const id of uniqueIds) {
      const before = await getOrderById(id, conn);
      if (!before) continue;

      const fromStatusId = await getStatusIdByName(before.status, conn);
      await conn.query("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", [
        toStatusId,
        nowIso(),
        id,
      ]);
      await conn.query(
        `INSERT INTO order_status_history
           (order_id, from_status, to_status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`,
        [id, fromStatusId, toStatusId, changedByUserId, note || ""],
      );
      changedIds.push(id);
    }

    await conn.commit();
    return Promise.all(changedIds.map((id) => getOrderById(id)));
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

async function confirmOrderDelivery(id, { deliveredQty, lossQty } = {}) {
  const order = await getOrderById(id);
  if (!order) return null;
  const nextStatus = "Recieve_By_Customer";
  const nextStatusId = await getStatusIdByName(nextStatus);
  if (!nextStatusId) {
    throw new Error("Status not found");
  }
  await getPool().query("CALL sp_confirm_order_delivery(?, ?, ?, ?, ?)", [
    id,
    nextStatusId,
    deliveredQty,
    lossQty,
    nowIso(),
  ]);
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
  listFactoryNotificationOrdersByOrderId,
  countNonTerminalOrdersByCustomer,
  createOrder,
  updateOrderAssignment,
  updateOrderStatus,
  updateOrderStatuses,
  confirmOrderDelivery,
  deleteOrder,
};
