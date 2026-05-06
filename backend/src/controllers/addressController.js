const addressService = require("../services/addressService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listAddresses = asyncHandler(async (_req, res) => {
  const rows = await addressService.listAddresses();
  return success(res, rows);
});

const createAddress = asyncHandler(async (req, res) => {
  const row = await addressService.createAddress(req.body);
  return created(res, row);
});

const updateAddress = asyncHandler(async (req, res) => {
  const row = await addressService.updateAddress(req.params.id, req.body);
  return success(res, row);
});

const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.params.id);
  return noContent(res);
});

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
