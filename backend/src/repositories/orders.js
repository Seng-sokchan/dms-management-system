const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapOrder } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");
const { getStatusIdByName } = require("./lookups");
const { ORDER_TYPE_CUSTOMER, formatOrderNo } = require("../constants/orderTypes");
const V = require("./sql/readViews");
const {
  ORDER_DETAIL_LIST_SELECT,
  ORDER_DETAIL_FROM,
  PAYMENT_STATUS_EXPR,
} = require("./sql/orderQueries");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function allocateOrderNo(targetType, executor) {
  const db = resolveExecutor(executor);
  const type = Number(targetType) === 2 ? 2 : 1;
  const prefix = type === 2 ? "DEP" : "ORD";
  const [rows] = await db.query(
    `SELECT order_no FROM orders
     WHERE target_type = ? AND order_no IS NOT NULL AND order_no LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [type, `${prefix}-%`],
  );

  let nextSeq = 1;
  if (rows[0]?.order_no) {
    const parts = String(rows[0].order_no).split("-");
    const parsed = Number(parts[parts.length - 1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      nextSeq = parsed + 1;
    }
  }

  return formatOrderNo(type, nextSeq);
}

async function createMasterOrder(orderType, executor) {
  const db = resolveExecutor(executor);
  const targetType = Number(orderType) === 2 ? 2 : 1;
  const orderNo = await allocateOrderNo(targetType, executor);
  const ts = nowIso();
  const [result] = await db.query(
    "INSERT INTO orders (target_type, order_no, created_at, updated_at) VALUES (?, ?, ?, ?)",
    [targetType, orderNo, ts, ts],
  );
  return { id: result.insertId, targetType, orderNo };
}

async function getMasterOrderById(masterOrderId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    "SELECT id, target_type, order_no, created_at, updated_at FROM orders WHERE id = ? LIMIT 1",
    [Number(masterOrderId)],
  );
  return rows[0]
    ? {
        id: Number(rows[0].id),
        targetType: Number(rows[0].target_type) === 2 ? 2 : 1,
        orderNo: rows[0].order_no != null ? String(rows[0].order_no) : null,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
      }
    : null;
}

async function getMasterOrderIdForDetailId(detailId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    "SELECT order_id FROM order_details WHERE id = ? LIMIT 1",
    [Number(detailId)],
  );
  return rows[0]?.order_id != null ? Number(rows[0].order_id) : null;
}

async function listOrderDetailIdsByMasterOrderId(masterOrderId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    "SELECT id FROM order_details WHERE order_id = ? ORDER BY id ASC",
    [Number(masterOrderId)],
  );
  return rows.map((row) => String(row.id));
}

async function listOrdersByMasterOrderId(masterOrderId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT ${ORDER_DETAIL_LIST_SELECT}
     ${ORDER_DETAIL_FROM}
     WHERE om.id = ?
     ORDER BY od.id ASC`,
    [Number(masterOrderId)],
  );
  return rows.map(mapOrder);
}

async function listOrders() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.ORDERS} ORDER BY id DESC`);
  return rows.map(mapOrder);
}

/** True when the agent has at least one Ready_For_Delivery order_detail. */
async function agentHasReadyForDeliveryOrder(deliveryAgentId) {
  const agentId = Number(deliveryAgentId);
  if (!Number.isFinite(agentId) || agentId <= 0) return false;
  const [rows] = await getPool().query(
    `SELECT 1 AS ok
     FROM order_details od
     INNER JOIN status s ON s.id = od.status
     WHERE od.delivery_agent_id = ?
       AND s.name = 'Ready_For_Delivery'
     LIMIT 1`,
    [agentId],
  );
  return Boolean(rows[0]);
}

async function getOrderById(id, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(`SELECT * FROM ${V.ORDERS} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapOrder(rows[0]) : null;
}

async function listFactoryNotificationOrdersByOrderId(id) {
  const [rows] = await getPool().query(
    `SELECT
       od.id,
       c.name AS customer_name,
       od.customer_id,
       od.item_id,
       od.currency,
       od.ordered_qty,
       od.unit_price,
       od.producer_id,
       od.delivery_agent_id,
       od.delivery_time,
       od.amount_total,
       s.name AS status,
       od.created_at,
       od.updated_at,
       c.phone AS customer_phone,
       c.province_id AS customer_province_id,
       pr.name AS customer_province_name,
       c.latitude AS customer_latitude,
       c.longitude AS customer_longitude,
       p.name AS producer_name,
       da.name AS delivery_agent_name,
       it.name AS item_name,
       it.sku AS item_sku
     FROM order_details source
     INNER JOIN order_details od ON (
       od.id = source.id
       OR (
         source.delivery_agent_id IS NOT NULL
         AND od.status = source.status
         AND od.delivery_agent_id = source.delivery_agent_id
       )
     )
     INNER JOIN customers c ON c.id = od.customer_id
     INNER JOIN items it ON it.id = od.item_id
     INNER JOIN status s ON s.id = od.status
     LEFT JOIN provinces pr ON pr.id = c.province_id AND pr.is_active = 1
     LEFT JOIN producers p ON p.id = od.producer_id
     LEFT JOIN delivery_agents da ON da.id = od.delivery_agent_id
     WHERE source.id = ?
     ORDER BY c.name, it.name, od.id`,
    [id],
  );
  return rows.map(mapOrder);
}

const TERMINAL_ORDER_STATUS_NAME = "Recieve_By_Customer";

async function countNonTerminalOrdersByCustomer(customerId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM order_details od
     INNER JOIN status s ON s.id = od.status
     WHERE od.customer_id = ? AND s.name <> ?`,
    [Number(customerId), TERMINAL_ORDER_STATUS_NAME],
  );
  return Number(rows[0]?.cnt || 0);
}

async function countUnpaidReceivedOrdersByCustomer(customerId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM order_details od
     INNER JOIN orders om ON om.id = od.order_id
     INNER JOIN status s ON s.id = od.status
     WHERE od.customer_id = ?
       AND s.name = ?
       AND (${PAYMENT_STATUS_EXPR}) IN ('unpaid', 'pending')`,
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

  let masterOrderId = null;
  if (order.masterOrderId) {
    masterOrderId = Number(order.masterOrderId);
  } else {
    const masterType = order.masterOrderType != null ? Number(order.masterOrderType) : ORDER_TYPE_CUSTOMER;
    const master = await createMasterOrder(masterType, executor);
    masterOrderId = master.id;
  }

  const [rowsRaw] = await db.query(
    "CALL sp_create_order_detail(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      masterOrderId,
      customerId,
      itemId,
      order.orderedQty,
      order.unitPrice,
      order.currency || "KHR",
      producerId,
      order.amountTotal,
      statusId,
      order.updatedAt,
    ],
  );
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

async function updateOrderStatus(id, status) {
  const before = await getOrderById(id);
  if (!before) return null;
  const toStatusId = await getStatusIdByName(status);
  if (!toStatusId) {
    throw new Error("Status not found");
  }
  await getPool().query("CALL sp_update_order_status(?, ?, ?)", [id, toStatusId, nowIso()]);
  return getOrderById(id);
}

async function updateOrderStatuses(ids, status) {
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

      await conn.query("UPDATE order_details SET status = ?, updated_at = ? WHERE id = ?", [
        toStatusId,
        nowIso(),
        id,
      ]);
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
  createMasterOrder,
  getMasterOrderById,
  getMasterOrderIdForDetailId,
  listOrderDetailIdsByMasterOrderId,
  listOrdersByMasterOrderId,
  listOrders,
  agentHasReadyForDeliveryOrder,
  getOrderById,
  listFactoryNotificationOrdersByOrderId,
  countNonTerminalOrdersByCustomer,
  countUnpaidReceivedOrdersByCustomer,
  createOrder,
  updateOrderAssignment,
  updateOrderStatus,
  updateOrderStatuses,
  confirmOrderDelivery,
  deleteOrder,
};
