const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");

function resolveExecutor(executor) {
  return executor || getPool();
}

function formatDateOnly(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value.trim())) {
    return value.trim().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return raw.slice(0, 10);
}

function mapSpecialDay(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    eventDate: formatDateOnly(row.event_date),
    itemId: row.item_id != null ? String(row.item_id) : null,
    itemName: row.item_name != null ? String(row.item_name) : null,
    status: row.status,
    notes: row.notes != null ? String(row.notes) : null,
    createdBy: row.created_by != null ? String(row.created_by) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRegistration(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    specialDayId: String(row.special_day_id),
    targetType: Number(row.target_type) === 2 ? 2 : 1,
    customerId: row.customer_id != null ? String(row.customer_id) : null,
    customerName: row.customer_name != null ? String(row.customer_name) : null,
    customerPhone: row.customer_phone != null ? String(row.customer_phone) : null,
    customerLat: row.customer_latitude != null ? Number(row.customer_latitude) : null,
    customerLng: row.customer_longitude != null ? Number(row.customer_longitude) : null,
    provinceId: row.province_id != null ? String(row.province_id) : null,
    provinceName: row.province_name != null ? String(row.province_name) : null,
    depotId: row.depot_id != null ? String(row.depot_id) : null,
    depotName: row.depot_name != null ? String(row.depot_name) : null,
    depotPhone: row.depot_phone != null ? String(row.depot_phone) : null,
    depotAddress: row.depot_address != null ? String(row.depot_address) : null,
    registeredByUserId: row.registered_by_user_id != null ? String(row.registered_by_user_id) : null,
    registeredAt: row.registered_at,
    status: row.status,
    updatedAt: row.updated_at,
    deliveryAgentId: row.delivery_agent_id != null ? String(row.delivery_agent_id) : null,
    deliveryAgentName: row.delivery_agent_name != null ? String(row.delivery_agent_name) : null,
    assignmentId: row.assignment_id != null ? String(row.assignment_id) : null,
    assignmentStatus: row.assignment_status != null ? String(row.assignment_status) : null,
    assignmentAcceptedAt: row.assignment_accepted_at || null,
    deliveredQtyTotal: row.delivered_qty_total != null ? Number(row.delivered_qty_total) : 0,
    deliveryCount: row.delivery_count != null ? Number(row.delivery_count) : 0,
  };
}

function mapAssignment(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    specialDayId: String(row.special_day_id),
    registrationId: String(row.registration_id),
    deliveryAgentId: String(row.delivery_agent_id),
    deliveryAgentName: row.delivery_agent_name != null ? String(row.delivery_agent_name) : null,
    status: row.status != null ? String(row.status) : "pending",
    assignedBy: row.assigned_by != null ? String(row.assigned_by) : null,
    assignedAt: row.assigned_at,
    acceptedAt: row.accepted_at || null,
    updatedAt: row.updated_at,
  };
}

function mapDelivery(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    specialDayId: String(row.special_day_id),
    registrationId: String(row.registration_id),
    deliveryAgentId: row.delivery_agent_id != null ? String(row.delivery_agent_id) : null,
    deliveryAgentName: row.delivery_agent_name != null ? String(row.delivery_agent_name) : null,
    deliveredByUserId: row.delivered_by_user_id != null ? String(row.delivered_by_user_id) : null,
    quantity: Number(row.quantity),
    deliveredAt: row.delivered_at,
    orderDetailId: row.order_detail_id != null ? String(row.order_detail_id) : null,
    customerName: row.customer_name != null ? String(row.customer_name) : null,
    depotName: row.depot_name != null ? String(row.depot_name) : null,
    provinceName: row.province_name != null ? String(row.province_name) : null,
  };
}

const REGISTRATION_SELECT = `
  r.id,
  r.special_day_id,
  r.target_type,
  r.customer_id,
  r.depot_id,
  r.registered_by_user_id,
  r.registered_at,
  r.status,
  r.updated_at,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.latitude AS customer_latitude,
  c.longitude AS customer_longitude,
  c.province_id,
  p.name AS province_name,
  d.name AS depot_name,
  d.phone AS depot_phone,
  d.address AS depot_address,
  a.id AS assignment_id,
  a.delivery_agent_id,
  a.status AS assignment_status,
  a.accepted_at AS assignment_accepted_at,
  da.name AS delivery_agent_name,
  COALESCE(del.delivered_qty_total, 0) AS delivered_qty_total,
  COALESCE(del.delivery_count, 0) AS delivery_count
`;

const REGISTRATION_FROM = `
  FROM special_day_registrations r
  LEFT JOIN customers c ON c.id = r.customer_id
  LEFT JOIN provinces p ON p.id = c.province_id
  LEFT JOIN province_customer_priority pcp
    ON pcp.province_id = c.province_id AND pcp.customer_id = c.id
  LEFT JOIN depots d ON d.id = r.depot_id
  LEFT JOIN special_day_assignments a ON a.registration_id = r.id
  LEFT JOIN delivery_agents da ON da.id = a.delivery_agent_id
  LEFT JOIN (
    SELECT registration_id,
           SUM(quantity) AS delivered_qty_total,
           COUNT(*) AS delivery_count
    FROM special_day_deliveries
    GROUP BY registration_id
  ) del ON del.registration_id = r.id
`;

async function listSpecialDays(executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT sd.*, i.name AS item_name
     FROM special_days sd
     LEFT JOIN items i ON i.id = sd.item_id
     ORDER BY sd.event_date DESC, sd.id DESC`,
  );
  return rows.map(mapSpecialDay);
}

async function listOpenSpecialDays(executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT sd.*, i.name AS item_name
     FROM special_days sd
     LEFT JOIN items i ON i.id = sd.item_id
     WHERE sd.status IN ('open', 'active')
     ORDER BY sd.event_date ASC, sd.id ASC`,
  );
  return rows.map(mapSpecialDay);
}

async function getSpecialDayById(id, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT sd.*, i.name AS item_name
     FROM special_days sd
     LEFT JOIN items i ON i.id = sd.item_id
     WHERE sd.id = ?
     LIMIT 1`,
    [Number(id)],
  );
  return mapSpecialDay(rows[0]);
}

async function createSpecialDay(payload, executor) {
  const db = resolveExecutor(executor);
  const ts = nowIso();
  const [result] = await db.query(
    `INSERT INTO special_days
      (name, event_date, item_id, status, notes, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.eventDate,
      Number(payload.itemId),
      payload.status || "open",
      payload.notes ?? null,
      payload.createdBy != null ? Number(payload.createdBy) : null,
      ts,
      ts,
    ],
  );
  return getSpecialDayById(result.insertId, executor);
}

async function updateSpecialDay(id, payload, executor) {
  const db = resolveExecutor(executor);
  const existing = await getSpecialDayById(id, executor);
  if (!existing) return null;

  const next = {
    name: payload.name !== undefined ? payload.name : existing.name,
    eventDate: payload.eventDate !== undefined ? payload.eventDate : existing.eventDate,
    itemId: payload.itemId !== undefined ? payload.itemId : existing.itemId,
    status: payload.status !== undefined ? payload.status : existing.status,
    notes: payload.notes !== undefined ? payload.notes : existing.notes,
  };
  const ts = nowIso();
  await db.query(
    `UPDATE special_days
     SET name = ?, event_date = ?, item_id = ?, status = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [next.name, next.eventDate, Number(next.itemId), next.status, next.notes, ts, Number(id)],
  );
  return getSpecialDayById(id, executor);
}

async function getRegistrationById(id, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT ${REGISTRATION_SELECT} ${REGISTRATION_FROM} WHERE r.id = ? LIMIT 1`,
    [Number(id)],
  );
  return mapRegistration(rows[0]);
}

async function findActiveRegistration({ specialDayId, customerId, depotId }, executor) {
  const db = resolveExecutor(executor);
  if (customerId != null) {
    const [rows] = await db.query(
      `SELECT ${REGISTRATION_SELECT} ${REGISTRATION_FROM}
       WHERE r.special_day_id = ? AND r.customer_id = ? AND r.status = 'registered'
       LIMIT 1`,
      [Number(specialDayId), Number(customerId)],
    );
    return mapRegistration(rows[0]);
  }
  if (depotId != null) {
    const [rows] = await db.query(
      `SELECT ${REGISTRATION_SELECT} ${REGISTRATION_FROM}
       WHERE r.special_day_id = ? AND r.depot_id = ? AND r.status = 'registered'
       LIMIT 1`,
      [Number(specialDayId), Number(depotId)],
    );
    return mapRegistration(rows[0]);
  }
  return null;
}

async function findAnyRegistration({ specialDayId, customerId, depotId }, executor) {
  const db = resolveExecutor(executor);
  if (customerId != null) {
    const [rows] = await db.query(
      `SELECT ${REGISTRATION_SELECT} ${REGISTRATION_FROM}
       WHERE r.special_day_id = ? AND r.customer_id = ?
       ORDER BY r.id DESC
       LIMIT 1`,
      [Number(specialDayId), Number(customerId)],
    );
    return mapRegistration(rows[0]);
  }
  if (depotId != null) {
    const [rows] = await db.query(
      `SELECT ${REGISTRATION_SELECT} ${REGISTRATION_FROM}
       WHERE r.special_day_id = ? AND r.depot_id = ?
       ORDER BY r.id DESC
       LIMIT 1`,
      [Number(specialDayId), Number(depotId)],
    );
    return mapRegistration(rows[0]);
  }
  return null;
}

async function createRegistration(payload, executor) {
  const db = resolveExecutor(executor);
  const ts = nowIso();
  const [result] = await db.query(
    `INSERT INTO special_day_registrations
      (special_day_id, target_type, customer_id, depot_id, registered_by_user_id, registered_at, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'registered', ?)`,
    [
      Number(payload.specialDayId),
      Number(payload.targetType) === 2 ? 2 : 1,
      payload.customerId != null ? Number(payload.customerId) : null,
      payload.depotId != null ? Number(payload.depotId) : null,
      payload.registeredByUserId != null ? Number(payload.registeredByUserId) : null,
      ts,
      ts,
    ],
  );
  return getRegistrationById(result.insertId, executor);
}

async function reactivateRegistration(id, registeredByUserId, executor) {
  const db = resolveExecutor(executor);
  const ts = nowIso();
  await db.query(
    `UPDATE special_day_registrations
     SET status = 'registered', registered_by_user_id = ?, registered_at = ?, updated_at = ?
     WHERE id = ?`,
    [
      registeredByUserId != null ? Number(registeredByUserId) : null,
      ts,
      ts,
      Number(id),
    ],
  );
  return getRegistrationById(id, executor);
}

async function cancelRegistration(id, executor) {
  const db = resolveExecutor(executor);
  const ts = nowIso();
  await db.query(
    `UPDATE special_day_registrations SET status = 'cancelled', updated_at = ? WHERE id = ?`,
    [ts, Number(id)],
  );
  return getRegistrationById(id, executor);
}

async function listRegistrations(specialDayId, { provinceId } = {}, executor) {
  const db = resolveExecutor(executor);
  const params = [Number(specialDayId)];
  let where = `WHERE r.special_day_id = ? AND r.status = 'registered'`;
  if (provinceId != null) {
    where += ` AND c.province_id = ?`;
    params.push(Number(provinceId));
  }
  const [rows] = await db.query(
    `SELECT ${REGISTRATION_SELECT} ${REGISTRATION_FROM}
     ${where}
     ORDER BY p.name ASC, (pcp.priority IS NULL) ASC, pcp.priority ASC, c.name ASC, d.name ASC, r.id ASC`,
    params,
  );
  return rows.map(mapRegistration);
}

async function listMyRegistrations({ customerId, depotId }, executor) {
  const db = resolveExecutor(executor);
  const params = [];
  let where = `WHERE r.status = 'registered' AND sd.status IN ('open', 'active')`;
  if (customerId != null) {
    where += ` AND r.customer_id = ?`;
    params.push(Number(customerId));
  } else if (depotId != null) {
    where += ` AND r.depot_id = ?`;
    params.push(Number(depotId));
  } else {
    return [];
  }
  const [rows] = await db.query(
    `SELECT ${REGISTRATION_SELECT}, sd.name AS special_day_name, sd.event_date, sd.status AS special_day_status
     ${REGISTRATION_FROM}
     INNER JOIN special_days sd ON sd.id = r.special_day_id
     ${where}
     ORDER BY sd.event_date ASC, r.id ASC`,
    params,
  );
  return rows.map((row) => ({
    ...mapRegistration(row),
    specialDayName: row.special_day_name != null ? String(row.special_day_name) : null,
    eventDate: formatDateOnly(row.event_date),
    specialDayStatus: row.special_day_status,
  }));
}

async function upsertAssignment(payload, executor) {
  const db = resolveExecutor(executor);
  const ts = nowIso();
  const existing = await getAssignmentByRegistrationId(payload.registrationId, executor);
  if (existing) {
    await db.query(
      `UPDATE special_day_assignments
       SET delivery_agent_id = ?, status = 'pending', assigned_by = ?, accepted_at = NULL, updated_at = ?
       WHERE registration_id = ?`,
      [
        Number(payload.deliveryAgentId),
        payload.assignedBy != null ? Number(payload.assignedBy) : null,
        ts,
        Number(payload.registrationId),
      ],
    );
    return getAssignmentByRegistrationId(payload.registrationId, executor);
  }
  const [result] = await db.query(
    `INSERT INTO special_day_assignments
      (special_day_id, registration_id, delivery_agent_id, status, assigned_by, assigned_at, accepted_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?, NULL, ?)`,
    [
      Number(payload.specialDayId),
      Number(payload.registrationId),
      Number(payload.deliveryAgentId),
      payload.assignedBy != null ? Number(payload.assignedBy) : null,
      ts,
      ts,
    ],
  );
  return getAssignmentById(result.insertId, executor);
}

async function acceptAssignment(registrationId, deliveryAgentId, executor) {
  const db = resolveExecutor(executor);
  const ts = nowIso();
  await db.query(
    `UPDATE special_day_assignments
     SET status = 'accepted', accepted_at = ?, updated_at = ?
     WHERE registration_id = ?
       AND delivery_agent_id = ?
       AND status = 'pending'`,
    [ts, ts, Number(registrationId), Number(deliveryAgentId)],
  );
  return getAssignmentByRegistrationId(registrationId, executor);
}

async function deleteAssignmentByRegistrationId(registrationId, executor) {
  const db = resolveExecutor(executor);
  await db.query(`DELETE FROM special_day_assignments WHERE registration_id = ?`, [
    Number(registrationId),
  ]);
}

async function getAssignmentById(id, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT a.*, da.name AS delivery_agent_name
     FROM special_day_assignments a
     LEFT JOIN delivery_agents da ON da.id = a.delivery_agent_id
     WHERE a.id = ?
     LIMIT 1`,
    [Number(id)],
  );
  return mapAssignment(rows[0]);
}

async function getAssignmentByRegistrationId(registrationId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT a.*, da.name AS delivery_agent_name
     FROM special_day_assignments a
     LEFT JOIN delivery_agents da ON da.id = a.delivery_agent_id
     WHERE a.registration_id = ?
     LIMIT 1`,
    [Number(registrationId)],
  );
  return mapAssignment(rows[0]);
}

async function listAssignmentsForAgent(deliveryAgentId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT ${REGISTRATION_SELECT}, sd.name AS special_day_name, sd.event_date, sd.item_id, i.name AS item_name, sd.status AS special_day_status
     ${REGISTRATION_FROM}
     INNER JOIN special_days sd ON sd.id = r.special_day_id
     LEFT JOIN items i ON i.id = sd.item_id
     WHERE a.delivery_agent_id = ?
       AND r.status = 'registered'
       AND sd.status IN ('open', 'active')
     ORDER BY sd.event_date ASC, p.name ASC, (pcp.priority IS NULL) ASC, pcp.priority ASC, c.name ASC, d.name ASC`,
    [Number(deliveryAgentId)],
  );
  return rows.map((row) => ({
    ...mapRegistration(row),
    specialDayName: row.special_day_name != null ? String(row.special_day_name) : null,
    eventDate: formatDateOnly(row.event_date),
    itemId: row.item_id != null ? String(row.item_id) : null,
    itemName: row.item_name != null ? String(row.item_name) : null,
    specialDayStatus: row.special_day_status,
  }));
}

async function createDelivery(payload, executor) {
  const db = resolveExecutor(executor);
  const ts = nowIso();
  const [result] = await db.query(
    `INSERT INTO special_day_deliveries
      (special_day_id, registration_id, delivery_agent_id, delivered_by_user_id, quantity, delivered_at, order_detail_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(payload.specialDayId),
      Number(payload.registrationId),
      Number(payload.deliveryAgentId),
      payload.deliveredByUserId != null ? Number(payload.deliveredByUserId) : null,
      Number(payload.quantity),
      ts,
      payload.orderDetailId != null ? Number(payload.orderDetailId) : null,
    ],
  );
  return getDeliveryById(result.insertId, executor);
}

async function setDeliveryOrderDetailId(deliveryId, orderDetailId, executor) {
  const db = resolveExecutor(executor);
  await db.query(`UPDATE special_day_deliveries SET order_detail_id = ? WHERE id = ?`, [
    Number(orderDetailId),
    Number(deliveryId),
  ]);
  return getDeliveryById(deliveryId, executor);
}

async function getDeliveryById(id, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT d.*, da.name AS delivery_agent_name,
            c.name AS customer_name, dep.name AS depot_name, p.name AS province_name
     FROM special_day_deliveries d
     LEFT JOIN delivery_agents da ON da.id = d.delivery_agent_id
     LEFT JOIN special_day_registrations r ON r.id = d.registration_id
     LEFT JOIN customers c ON c.id = r.customer_id
     LEFT JOIN depots dep ON dep.id = r.depot_id
     LEFT JOIN provinces p ON p.id = c.province_id
     WHERE d.id = ?
     LIMIT 1`,
    [Number(id)],
  );
  return mapDelivery(rows[0]);
}

async function listRecentDeliveries(specialDayId, limit = 50, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT d.*, da.name AS delivery_agent_name,
            c.name AS customer_name, dep.name AS depot_name, p.name AS province_name
     FROM special_day_deliveries d
     LEFT JOIN delivery_agents da ON da.id = d.delivery_agent_id
     LEFT JOIN special_day_registrations r ON r.id = d.registration_id
     LEFT JOIN customers c ON c.id = r.customer_id
     LEFT JOIN depots dep ON dep.id = r.depot_id
     LEFT JOIN provinces p ON p.id = c.province_id
     WHERE d.special_day_id = ?
     ORDER BY d.delivered_at DESC, d.id DESC
     LIMIT ?`,
    [Number(specialDayId), Number(limit)],
  );
  return rows.map(mapDelivery);
}

async function getProgress(specialDayId, executor) {
  const db = resolveExecutor(executor);
  const dayId = Number(specialDayId);

  const [[totals]] = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM special_day_registrations WHERE special_day_id = ? AND status = 'registered') AS registration_count,
       (SELECT COUNT(*) FROM special_day_assignments a
         INNER JOIN special_day_registrations r ON r.id = a.registration_id
         WHERE a.special_day_id = ? AND r.status = 'registered') AS assigned_count,
       (SELECT COALESCE(SUM(quantity), 0) FROM special_day_deliveries WHERE special_day_id = ?) AS total_delivered_qty,
       (SELECT COUNT(*) FROM special_day_deliveries WHERE special_day_id = ?) AS delivery_count`,
    [dayId, dayId, dayId, dayId],
  );

  const [byProvince] = await db.query(
    `SELECT
       COALESCE(p.id, 0) AS province_id,
       COALESCE(p.name, 'Unspecified') AS province_name,
       COALESCE(SUM(d.quantity), 0) AS delivered_qty,
       COUNT(d.id) AS delivery_count
     FROM special_day_deliveries d
     INNER JOIN special_day_registrations r ON r.id = d.registration_id
     LEFT JOIN customers c ON c.id = r.customer_id
     LEFT JOIN provinces p ON p.id = c.province_id
     WHERE d.special_day_id = ?
     GROUP BY COALESCE(p.id, 0), COALESCE(p.name, 'Unspecified')
     ORDER BY province_name ASC`,
    [dayId],
  );

  const [byAgent] = await db.query(
    `SELECT
       da.id AS delivery_agent_id,
       da.name AS delivery_agent_name,
       COALESCE(SUM(d.quantity), 0) AS delivered_qty,
       COUNT(d.id) AS delivery_count
     FROM special_day_deliveries d
     INNER JOIN delivery_agents da ON da.id = d.delivery_agent_id
     WHERE d.special_day_id = ?
     GROUP BY da.id, da.name
     ORDER BY da.name ASC`,
    [dayId],
  );

  const recentDeliveries = await listRecentDeliveries(dayId, 30, executor);

  return {
    specialDayId: String(dayId),
    registrationCount: Number(totals.registration_count || 0),
    assignedCount: Number(totals.assigned_count || 0),
    totalDeliveredQty: Number(totals.total_delivered_qty || 0),
    deliveryCount: Number(totals.delivery_count || 0),
    byProvince: byProvince.map((row) => ({
      provinceId: row.province_id ? String(row.province_id) : null,
      provinceName: row.province_name,
      deliveredQty: Number(row.delivered_qty || 0),
      deliveryCount: Number(row.delivery_count || 0),
    })),
    byAgent: byAgent.map((row) => ({
      deliveryAgentId: String(row.delivery_agent_id),
      deliveryAgentName: row.delivery_agent_name,
      deliveredQty: Number(row.delivered_qty || 0),
      deliveryCount: Number(row.delivery_count || 0),
    })),
    recentDeliveries,
  };
}

async function finalizeOrderAsReceived(
  orderDetailId,
  { deliveredQty, deliveryAgentId, deliveryTime },
  executor,
) {
  const db = resolveExecutor(executor);
  const { getStatusIdByName } = require("./lookups");
  const statusId = await getStatusIdByName("Recieve_By_Customer", executor);
  if (!statusId) throw new Error("Status not found");
  const ts = deliveryTime || nowIso();
  await db.query(
    `UPDATE order_details
     SET delivered_qty = ?,
         loss_qty = 0,
         delivery_agent_id = ?,
         delivery_time = ?,
         status = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      Number(deliveredQty),
      Number(deliveryAgentId),
      ts,
      statusId,
      ts,
      Number(orderDetailId),
    ],
  );
}

module.exports = {
  listSpecialDays,
  listOpenSpecialDays,
  getSpecialDayById,
  createSpecialDay,
  updateSpecialDay,
  getRegistrationById,
  findActiveRegistration,
  findAnyRegistration,
  createRegistration,
  reactivateRegistration,
  cancelRegistration,
  listRegistrations,
  listMyRegistrations,
  upsertAssignment,
  acceptAssignment,
  deleteAssignmentByRegistrationId,
  getAssignmentById,
  getAssignmentByRegistrationId,
  listAssignmentsForAgent,
  createDelivery,
  setDeliveryOrderDetailId,
  getDeliveryById,
  listRecentDeliveries,
  getProgress,
  finalizeOrderAsReceived,
};
