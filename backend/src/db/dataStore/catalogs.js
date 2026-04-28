const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapCatalog } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listCatalogs() {
  const [rows] = await getPool().query("CALL sp_list_catalogs()");
  return unwrapProcedureRows(rows).map(mapCatalog);
}

async function getCatalogById(id) {
  const [rows] = await getPool().query("CALL sp_get_catalog_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapCatalog(resultRows[0]) : null;
}

async function createCatalog(payload) {
  const name = String(payload.name || "").trim();
  const [rowsRaw] = await getPool().query("CALL sp_create_catalog(?, ?, ?)", [
    name,
    (payload.note && String(payload.note)) || "",
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getCatalogById(meta.insertId);
}

async function updateCatalog(id, payload) {
  const name = String(payload.name || "").trim();
  const note = (payload.note && String(payload.note).trim()) || "";
  const [rowsRaw] = await getPool().query("CALL sp_update_catalog(?, ?, ?, ?)", [id, name, note, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getCatalogById(id);
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
