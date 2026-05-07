const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapCustomerItemPrice } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listCustomerItemPrices() {
  const [rows] = await getPool().query("CALL sp_list_customer_item_prices()");
  return unwrapProcedureRows(rows).map(mapCustomerItemPrice);
}

async function getCustomerItemPrice(customerId, itemId, currency) {
  const [rows] = await getPool().query("CALL sp_get_customer_item_price(?, ?, ?)", [customerId, itemId, currency]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapCustomerItemPrice(resultRows[0]) : null;
}

async function upsertCustomerItemPrice(payload) {
  const customerId = Number(payload.customerId);
  const itemId = Number(payload.itemId);
  const unitPrice = Number(payload.unitPrice);
  const currency = String(payload.currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";

  await getPool().query("CALL sp_upsert_customer_item_price(?, ?, ?, ?, ?)", [
    customerId,
    itemId,
    currency,
    unitPrice,
    nowIso(),
  ]);
  return getCustomerItemPrice(customerId, itemId, currency);
}

async function deleteCustomerItemPrice(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_customer_item_price(?)", [id]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listCustomerItemPrices,
  getCustomerItemPrice,
  upsertCustomerItemPrice,
  deleteCustomerItemPrice,
};
