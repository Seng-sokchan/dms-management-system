const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapItem } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listItems(filters = {}) {
  const customerId = filters.customerId ? Number(filters.customerId) : null;
  const [rows] = await getPool().query("CALL sp_list_items(?)", [customerId]);
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
  const customerId = payload.customerId ? Number(payload.customerId) : null;
  const [rowsRaw] = await getPool().query("CALL sp_create_item(?, ?, ?, ?, ?, ?, ?)", [
    catalogId, customerId, name, sku, Number(payload.defaultUnitPriceUsd), Number(payload.defaultUnitPriceKhr), nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getItemById(meta.insertId);
}

async function updateItem(id, payload) {
  const name = String(payload.name || "").trim();
  const sku = (payload.sku && String(payload.sku).trim()) || "";
  const catalogId = String(payload.catalogId || "").trim();
  const defaultUnitPriceUsd = Number(payload.defaultUnitPriceUsd);
  const defaultUnitPriceKhr = Number(payload.defaultUnitPriceKhr);
  const customerId = payload.customerId ? Number(payload.customerId) : null;
  const [rowsRaw] = await getPool().query("CALL sp_update_item(?, ?, ?, ?, ?, ?, ?, ?)", [
    id, catalogId, customerId, name, sku, defaultUnitPriceUsd, defaultUnitPriceKhr, nowIso(),
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
