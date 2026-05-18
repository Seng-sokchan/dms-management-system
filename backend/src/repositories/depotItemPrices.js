const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapDepotItemPrice } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listDepotItemPrices() {
  const [rows] = await getPool().query("CALL sp_list_depot_item_prices()");
  return unwrapProcedureRows(rows).map(mapDepotItemPrice);
}

async function getDepotItemPrice(depotId, itemId, currency) {
  const [rows] = await getPool().query("CALL sp_get_depot_item_price(?, ?, ?)", [depotId, itemId, currency]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapDepotItemPrice(resultRows[0]) : null;
}

async function upsertDepotItemPrice(payload) {
  const depotId = Number(payload.depotId);
  const itemId = Number(payload.itemId);
  const unitPrice = Number(payload.unitPrice);
  const currency = String(payload.currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";

  await getPool().query("CALL sp_upsert_depot_item_price(?, ?, ?, ?, ?)", [
    depotId,
    itemId,
    currency,
    unitPrice,
    nowIso(),
  ]);
  return getDepotItemPrice(depotId, itemId, currency);
}

async function deleteDepotItemPrice(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_depot_item_price(?)", [id]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listDepotItemPrices,
  getDepotItemPrice,
  upsertDepotItemPrice,
  deleteDepotItemPrice,
};
