const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapCatalog } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

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
  const [result] = await getPool().query(
    "INSERT INTO catalogs (name, note, updated_at) VALUES (?, ?, ?)",
    [name, (payload.note && String(payload.note)) || "", nowIso()],
  );
  return getCatalogById(result.insertId);
}

async function updateCatalog(id, payload) {
  const name = String(payload.name || "").trim();
  const note = (payload.note && String(payload.note).trim()) || "";
  const [result] = await getPool().query(
    "UPDATE catalogs SET name = ?, note = ?, updated_at = ? WHERE id = ? AND is_active = 1",
    [name, note, nowIso(), id],
  );
  if (!result.affectedRows) return null;
  return getCatalogById(id);
}

async function deleteCatalog(id) {
  const [result] = await getPool().query(
    "UPDATE catalogs SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1",
    [nowIso(), id],
  );
  return result.affectedRows > 0;
}

module.exports = {
  listCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
};
