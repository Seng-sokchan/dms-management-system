const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapItem } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

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
  const [result] = await getPool().query(
    "INSERT INTO items (catalog_id, name, sku, default_unit_price_usd, default_unit_price_khr, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [catalogId, name, sku, Number(payload.defaultUnitPriceUsd), Number(payload.defaultUnitPriceKhr), nowIso()],
  );
  return getItemById(result.insertId);
}

async function updateItem(id, payload) {
  const name = String(payload.name || "").trim();
  const sku = (payload.sku && String(payload.sku).trim()) || "";
  const catalogId = String(payload.catalogId || "").trim();
  const defaultUnitPriceUsd = Number(payload.defaultUnitPriceUsd);
  const defaultUnitPriceKhr = Number(payload.defaultUnitPriceKhr);
  const [result] = await getPool().query(
    "UPDATE items SET catalog_id = ?, name = ?, sku = ?, default_unit_price_usd = ?, default_unit_price_khr = ?, updated_at = ? WHERE id = ? AND is_active = 1",
    [catalogId, name, sku, defaultUnitPriceUsd, defaultUnitPriceKhr, nowIso(), id],
  );
  if (!result.affectedRows) return null;
  return getItemById(id);
}

async function deleteItem(id) {
  const [result] = await getPool().query(
    "UPDATE items SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1",
    [nowIso(), id],
  );
  return result.affectedRows > 0;
}

module.exports = {
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
