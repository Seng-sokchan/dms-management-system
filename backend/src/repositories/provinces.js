const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapProvince } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listProvinces() {
  const [rows] = await getPool().query("CALL sp_list_provinces()");
  return unwrapProcedureRows(rows).map(mapProvince);
}

async function getProvinceById(id) {
  const [rows] = await getPool().query("CALL sp_get_province_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapProvince(resultRows[0]) : null;
}

async function createProvince(payload) {
  const name = String(payload.name || "").trim();
  const [rowsRaw] = await getPool().query("CALL sp_create_province(?, ?)", [
    name,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getProvinceById(meta.insertId);
}

async function updateProvince(id, payload) {
  const name = String(payload.name || "").trim();
  const [rowsRaw] = await getPool().query("CALL sp_update_province(?, ?, ?)", [
    id,
    name,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getProvinceById(id);
}

async function deleteProvince(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_province(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
};
