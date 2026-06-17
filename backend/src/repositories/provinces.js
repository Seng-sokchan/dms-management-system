const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapProvince } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listProvinces() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.PROVINCES} ORDER BY id DESC`);
  return rows.map(mapProvince);
}

async function getProvinceById(id) {
  const [rows] = await getPool().query(`SELECT * FROM ${V.PROVINCES} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapProvince(rows[0]) : null;
}

async function createProvince(payload) {
  const [rowsRaw] = await getPool().query("CALL sp_create_province(?, ?)", [
    payload.name,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getProvinceById(meta.insertId);
}

async function updateProvince(id, payload) {
  const [rowsRaw] = await getPool().query("CALL sp_update_province(?, ?, ?)", [
    id,
    payload.name,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0 ? getProvinceById(id) : null;
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
