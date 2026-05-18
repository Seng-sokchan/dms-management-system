const depotItemPriceService = require("../services/depotItemPriceService");
const { success, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listDepotItemPrices = asyncHandler(async (req, res) => {
  const rows = await depotItemPriceService.list(req.user);
  return success(res, rows);
});

const upsertDepotItemPrice = asyncHandler(async (req, res) => {
  const row = await depotItemPriceService.upsert(req.user, req.body);
  return success(res, row);
});

const deleteDepotItemPrice = asyncHandler(async (req, res) => {
  await depotItemPriceService.remove(req.user, req.params.id);
  return noContent(res);
});

module.exports = {
  listDepotItemPrices,
  upsertDepotItemPrice,
  deleteDepotItemPrice,
};
