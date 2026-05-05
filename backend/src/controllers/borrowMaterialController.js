const borrowMaterialService = require("../services/borrowMaterialService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listBorrowMaterials = asyncHandler(async (req, res) => {
  const materials = await borrowMaterialService.listBorrowMaterials();
  return success(res, materials);
});

const createBorrowMaterial = asyncHandler(async (req, res) => {
  const material = await borrowMaterialService.createBorrowMaterial(req.body);
  return created(res, material);
});

const updateBorrowMaterial = asyncHandler(async (req, res) => {
  const material = await borrowMaterialService.updateBorrowMaterial(req.params.id, req.body);
  return success(res, material);
});

const deleteBorrowMaterial = asyncHandler(async (req, res) => {
  await borrowMaterialService.deleteBorrowMaterial(req.params.id);
  return noContent(res);
});

module.exports = {
  listBorrowMaterials,
  createBorrowMaterial,
  updateBorrowMaterial,
  deleteBorrowMaterial,
};
