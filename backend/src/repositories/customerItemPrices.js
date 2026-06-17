const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapCustomerItemPrice } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");
const { RESOLVED_CUSTOMER_ITEM_PRICE_SQL } = require("./sql/customerItemPriceQueries");

async function listCustomerItemPrices() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.CUSTOMER_ITEM_PRICES} ORDER BY id DESC`);
  return rows.map(mapCustomerItemPrice);
}

async function getCustomerItemPrice(customerId, itemId, currency) {
  const params = [
    customerId,
    itemId,
    currency,
    customerId,
    itemId,
    currency,
    customerId,
    itemId,
    currency,
  ];
  const [rows] = await getPool().query(RESOLVED_CUSTOMER_ITEM_PRICE_SQL, params);
  return rows[0] ? mapCustomerItemPrice(rows[0]) : null;
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
