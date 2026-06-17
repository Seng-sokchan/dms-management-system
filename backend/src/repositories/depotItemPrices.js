const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapDepotItemPrice } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listDepotItemPrices() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.DEPOT_ITEM_PRICES} ORDER BY id DESC`);
  return rows.map(mapDepotItemPrice);
}

async function getDepotItemPrice(depotId, itemId, currency) {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.DEPOT_ITEM_PRICES}
     WHERE depot_id = ? AND item_id = ? AND currency = ?
     LIMIT 1`,
    [depotId, itemId, currency],
  );
  return rows[0] ? mapDepotItemPrice(rows[0]) : null;
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
