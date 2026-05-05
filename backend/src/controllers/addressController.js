const addressService = require("../services/addressService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listAddresses = asyncHandler(async (_req, res) => {
  const rows = await addressService.listAddresses();
  return success(res, rows);
});

module.exports = {
  listAddresses,
};
