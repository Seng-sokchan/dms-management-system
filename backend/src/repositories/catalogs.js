const { getPool } = require("../../database/pool");
const { mapCatalog } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");
const { nowIso } = require("../utils");
const V = require("./sql/readViews");

async function listCatalogs() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.CATALOGS} ORDER BY id DESC`);
  return rows.map(mapCatalog);
}

async function getCatalogById(id) {
  const [rows] = await getPool().query(`SELECT * FROM ${V.CATALOGS} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapCatalog(rows[0]) : null;
}

async function createCatalog(payload) {
  const [rowsRaw] = await getPool().query("CALL sp_create_catalog(?, ?, ?)", [
    payload.name,
    payload.note || "",
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getCatalogById(meta.insertId);
}

async function updateCatalog(id, payload) {
  const [rowsRaw] = await getPool().query("CALL sp_update_catalog(?, ?, ?, ?)", [
    id,
    payload.name,
    payload.note || "",
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0 ? getCatalogById(id) : null;
}

async function deleteCatalog(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_catalog(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
};
