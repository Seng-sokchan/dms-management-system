const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapAddress } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

async function listAddresses() {
  const [rows] = await getPool().query("CALL sp_list_addresses()");
  return unwrapProcedureRows(rows).map(mapAddress);
}

async function getAddressById(id) {
  const [rows] = await getPool().query("SELECT id, name FROM addresses WHERE id = ? LIMIT 1", [Number(id)]);
  return rows[0] ? mapAddress(rows[0]) : null;
}

async function createAddress(payload) {
  const name = String(payload.name || "").trim();
  const [result] = await getPool().query("INSERT INTO addresses (name, updated_at) VALUES (?, ?)", [name, nowIso()]);
  return getAddressById(result.insertId);
}

async function updateAddress(id, payload) {
  const name = String(payload.name || "").trim();
  const [result] = await getPool().query("UPDATE addresses SET name = ?, updated_at = ? WHERE id = ?", [
    name,
    nowIso(),
    Number(id),
  ]);
  if (!Number(result.affectedRows || 0)) return null;
  return getAddressById(id);
}

async function deleteAddress(id) {
  const [result] = await getPool().query("DELETE FROM addresses WHERE id = ?", [Number(id)]);
  return Number(result.affectedRows || 0) > 0;
}

module.exports = {
  listAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};
