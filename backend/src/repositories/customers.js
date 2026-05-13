const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapCustomer } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function listCustomers() {
  const [rows] = await getPool().query("CALL sp_list_customers()");
  return unwrapProcedureRows(rows).map(mapCustomer);
}

async function listCustomersByDepotId(depotId) {
  const [rows] = await getPool().query("CALL sp_list_customers_by_depot_id(?)", [depotId]);
  return unwrapProcedureRows(rows).map(mapCustomer);
}

async function listCustomersByOwnerUserId(ownerUserId) {
  const [rows] = await getPool().query("CALL sp_list_customers_by_owner_user_id(?)", [ownerUserId]);
  return unwrapProcedureRows(rows).map(mapCustomer);
}

async function getCustomerById(id, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query("CALL sp_get_customer_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapCustomer(resultRows[0]) : null;
}

async function getCustomerByUserId(userId) {
  const [rows] = await getPool().query("CALL sp_get_customer_by_user_id(?)", [userId]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapCustomer(resultRows[0]) : null;
}

/**
 * Maintains users.customer_id via sp_set_customer_user_link.
 * @param {object|null} executor — connection or pool
 * @param {number|string|null} customerId — customer to unlink all users from when userId is null
 * @param {number|string|null} userId — user to unlink when customerId is null; or user to link when both set
 */
async function setCustomerUserLink(executor, customerId, userId) {
  const db = resolveExecutor(executor);
  const cid = customerId != null && String(customerId).trim() !== "" ? Number(customerId) : null;
  const uid = userId != null && String(userId).trim() !== "" ? Number(userId) : null;
  await db.query("CALL sp_set_customer_user_link(?, ?)", [cid, uid]);
}

function normalizeNullableString(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

/** After validation: both coordinates present or both absent; returns [lat, lng] for SQL NULL or DECIMAL. */
function customerLatLngForDb(payload) {
  if (payload.latitude === undefined && payload.longitude === undefined) {
    return [null, null];
  }
  return [Number(payload.latitude), Number(payload.longitude)];
}

async function createCustomer(payload, executor) {
  const db = resolveExecutor(executor);
  const name = String(payload.name || "").trim();
  const phone = normalizeNullableString(payload.phone);
  const address = Number(payload.address);
  const depotId = payload.depotId ? Number(payload.depotId) : null;
  const [latitude, longitude] = customerLatLngForDb(payload);
  const [rowsRaw] = await db.query("CALL sp_create_customer(?, ?, ?, ?, ?, ?, ?)", [
    name,
    phone,
    address,
    depotId,
    latitude,
    longitude,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getCustomerById(meta.insertId, db);
}

async function updateCustomer(id, payload, executor) {
  const db = resolveExecutor(executor);
  const name = String(payload.name || "").trim();
  const phone = normalizeNullableString(payload.phone);
  const address = Number(payload.address);
  const depotId = payload.depotId ? Number(payload.depotId) : null;
  const [latitude, longitude] = customerLatLngForDb(payload);
  const [rowsRaw] = await db.query("CALL sp_update_customer(?, ?, ?, ?, ?, ?, ?, ?)", [
    id,
    name,
    phone,
    address,
    depotId,
    latitude,
    longitude,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getCustomerById(id, db);
}

async function deleteCustomer(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_customer(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listCustomers,
  listCustomersByDepotId,
  listCustomersByOwnerUserId,
  getCustomerById,
  getCustomerByUserId,
  setCustomerUserLink,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
