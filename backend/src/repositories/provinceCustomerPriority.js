const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");

function resolveExecutor(executor) {
  return executor || getPool();
}

function mapPriorityCustomer(row, displayPriority) {
  return {
    id: String(row.id),
    name: row.name,
    depotId: row.depot_id != null ? String(row.depot_id) : "",
    depotName: row.depot_name || "",
    priority: displayPriority,
  };
}

async function listOrderedCustomersForProvince(provinceId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT
       c.id,
       c.name,
       c.depot_id,
       d.name AS depot_name,
       pcp.priority AS stored_priority
     FROM customers c
     LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
     LEFT JOIN province_customer_priority pcp
       ON pcp.province_id = c.province_id AND pcp.customer_id = c.id
     WHERE c.is_active = 1 AND c.province_id = ?
     ORDER BY (pcp.priority IS NULL) ASC, pcp.priority ASC, c.id ASC`,
    [Number(provinceId)],
  );
  return rows.map((row, index) => mapPriorityCustomer(row, index + 1));
}

async function listActiveCustomerIdsForProvince(provinceId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT id FROM customers
     WHERE is_active = 1 AND province_id = ?
     ORDER BY id ASC`,
    [Number(provinceId)],
  );
  return rows.map((row) => Number(row.id));
}

async function replaceProvincePriorities(provinceId, customerIds, executor) {
  const db = resolveExecutor(executor);
  const pid = Number(provinceId);
  const ts = nowIso();
  await db.query(`DELETE FROM province_customer_priority WHERE province_id = ?`, [pid]);
  for (let i = 0; i < customerIds.length; i += 1) {
    await db.query(
      `INSERT INTO province_customer_priority (province_id, customer_id, priority, updated_at)
       VALUES (?, ?, ?, ?)`,
      [pid, Number(customerIds[i]), i + 1, ts],
    );
  }
}

async function getMaxPriority(provinceId, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    `SELECT COALESCE(MAX(priority), 0) AS max_priority
     FROM province_customer_priority WHERE province_id = ?`,
    [Number(provinceId)],
  );
  return Number(rows[0]?.max_priority || 0);
}

async function assignNextPriority(provinceId, customerId, executor) {
  if (!provinceId || !customerId) return;
  const db = resolveExecutor(executor);
  const pid = Number(provinceId);
  const cid = Number(customerId);
  const [existing] = await db.query(
    `SELECT id FROM province_customer_priority
     WHERE province_id = ? AND customer_id = ? LIMIT 1`,
    [pid, cid],
  );
  if (existing.length) return;
  const next = (await getMaxPriority(pid, db)) + 1;
  await db.query(
    `INSERT INTO province_customer_priority (province_id, customer_id, priority, updated_at)
     VALUES (?, ?, ?, ?)`,
    [pid, cid, next, nowIso()],
  );
}

async function removeCustomerPriority(customerId, executor) {
  if (!customerId) return;
  const db = resolveExecutor(executor);
  await db.query(`DELETE FROM province_customer_priority WHERE customer_id = ?`, [
    Number(customerId),
  ]);
}

async function removeCustomerProvincePriority(provinceId, customerId, executor) {
  if (!provinceId || !customerId) return;
  const db = resolveExecutor(executor);
  await db.query(
    `DELETE FROM province_customer_priority WHERE province_id = ? AND customer_id = ?`,
    [Number(provinceId), Number(customerId)],
  );
}

async function moveCustomerProvincePriority(customerId, fromProvinceId, toProvinceId, executor) {
  if (!customerId) return;
  const db = resolveExecutor(executor);
  const cid = Number(customerId);
  if (fromProvinceId) {
    await removeCustomerProvincePriority(fromProvinceId, cid, db);
  } else {
    await removeCustomerPriority(cid, db);
  }
  if (toProvinceId) {
    await assignNextPriority(toProvinceId, cid, db);
  }
}

module.exports = {
  listOrderedCustomersForProvince,
  listActiveCustomerIdsForProvince,
  replaceProvincePriorities,
  assignNextPriority,
  removeCustomerPriority,
  removeCustomerProvincePriority,
  moveCustomerProvincePriority,
  getMaxPriority,
};
