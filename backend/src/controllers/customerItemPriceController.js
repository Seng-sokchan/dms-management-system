const customerItemPriceService = require("../services/customerItemPriceService");
const { success, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listCustomerItemPrices = asyncHandler(async (_req, res) => {
  const rows = await customerItemPriceService.list();
  return success(res, rows);
});

const upsertCustomerItemPrice = asyncHandler(async (req, res) => {
  const row = await customerItemPriceService.upsert(req.body);
  return success(res, row);
});

const deleteCustomerItemPrice = asyncHandler(async (req, res) => {
  await customerItemPriceService.remove(req.params.id);
  return noContent(res);
});

module.exports = {
  listCustomerItemPrices,
  upsertCustomerItemPrice,
  deleteCustomerItemPrice,
};
