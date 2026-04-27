const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapCustomer } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

async function listCustomers() {
  const [rows] = await getPool().query("CALL sp_list_customers()");
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

async function createCustomer(payload) {
  const name = String(payload.name || "").trim();
  const phone = (payload.phone && String(payload.phone).trim()) || "";
  const address = Number(payload.address);
  const userId = payload.userId ? Number(payload.userId) : null;
  const subAddress = (payload.subAddress && String(payload.subAddress).trim()) || "";
  const [result] = await getPool().query(
    "INSERT INTO customers (name, phone, address, user_id, sub_address, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [name, phone, address, userId, subAddress, nowIso()],
  );
  return getCustomerById(result.insertId);
}

async function updateCustomer(id, payload) {
  const name = String(payload.name || "").trim();
  const phone = (payload.phone && String(payload.phone).trim()) || "";
  const address = Number(payload.address);
  const userId = payload.userId ? Number(payload.userId) : null;
  const subAddress = (payload.subAddress && String(payload.subAddress).trim()) || "";
  const [result] = await getPool().query(
    "UPDATE customers SET name = ?, phone = ?, address = ?, user_id = ?, sub_address = ?, updated_at = ? WHERE id = ? AND is_active = 1",
    [name, phone, address, userId, subAddress, nowIso(), id],
  );
  if (!result.affectedRows) return null;
  return getCustomerById(id);
}

async function deleteCustomer(id) {
  const [result] = await getPool().query(
    "UPDATE customers SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1",
    [nowIso(), id],
  );
  return result.affectedRows > 0;
}

module.exports = {
  listCustomers,
  getCustomerById,
  getCustomerByUserId,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
