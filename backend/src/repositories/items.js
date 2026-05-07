const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapItem } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listItems() {
  const [rows] = await getPool().query("CALL sp_list_items()");
  return unwrapProcedureRows(rows).map(mapItem);
}

async function getItemById(id) {
  const [rows] = await getPool().query("CALL sp_get_item_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapItem(resultRows[0]) : null;
}

async function createItem(payload) {
  const name = String(payload.name || "").trim();
  const sku = (payload.sku && String(payload.sku).trim()) || "";
  const catalogId = Number(payload.catalogId);
  const [rowsRaw] = await getPool().query("CALL sp_create_item(?, ?, ?, ?)", [
    catalogId,
    name,
    sku,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getItemById(meta.insertId);
}

async function updateItem(id, payload) {
  const name = String(payload.name || "").trim();
  const sku = (payload.sku && String(payload.sku).trim()) || "";
  const catalogId = String(payload.catalogId || "").trim();
  const [rowsRaw] = await getPool().query("CALL sp_update_item(?, ?, ?, ?, ?)", [
    id,
    catalogId,
    name,
    sku,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getItemById(id);
}

async function deleteItem(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_item(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
