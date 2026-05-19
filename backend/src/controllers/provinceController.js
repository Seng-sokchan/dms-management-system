const provinceService = require("../services/provinceService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listProvinces = asyncHandler(async (_req, res) => {
  const provinces = await provinceService.listProvinces();
  return success(res, provinces);
});

const createProvince = asyncHandler(async (req, res) => {
  const row = await provinceService.createProvince(req.body);
  return created(res, row);
});

const updateProvince = asyncHandler(async (req, res) => {
  const row = await provinceService.updateProvince(req.params.id, req.body);
  return success(res, row);
});

const deleteProvince = asyncHandler(async (req, res) => {
  await provinceService.deleteProvince(req.params.id);
  return noContent(res);
});

module.exports = {
  listProvinces,
  createProvince,
  updateProvince,
  deleteProvince,
};
