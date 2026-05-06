const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapCustomer } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

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

async function getCustomerById(id) {
  const [rows] = await getPool().query("CALL sp_get_customer_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapCustomer(resultRows[0]) : null;
}

async function getCustomerByUserId(userId) {
  const [rows] = await getPool().query("CALL sp_list_customers()");
  const resultRows = unwrapProcedureRows(rows);
  const row = resultRows.find((item) => String(item.user_id || "") === String(userId));
  return row ? mapCustomer(row) : null;
}

function normalizeNullableString(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

async function createCustomer(payload) {
  const name = String(payload.name || "").trim();
  const phone = normalizeNullableString(payload.phone);
  const address = Number(payload.address);
  const userId = payload.userId ? Number(payload.userId) : null;
  const depotId = payload.depotId ? Number(payload.depotId) : null;
  const [rowsRaw] = await getPool().query("CALL sp_create_customer(?, ?, ?, ?, ?, ?)", [
    name,
    phone,
    address,
    userId,
    depotId,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getCustomerById(meta.insertId);
}

async function updateCustomer(id, payload) {
  const name = String(payload.name || "").trim();
  const phone = normalizeNullableString(payload.phone);
  const address = Number(payload.address);
  const userId = payload.userId ? Number(payload.userId) : null;
  const depotId = payload.depotId ? Number(payload.depotId) : null;
  const [rowsRaw] = await getPool().query("CALL sp_update_customer(?, ?, ?, ?, ?, ?, ?)", [
    id,
    name,
    phone,
    address,
    userId,
    depotId,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getCustomerById(id);
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
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
