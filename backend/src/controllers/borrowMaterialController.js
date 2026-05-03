const {
  listBorrowMaterials: listBorrowMaterialsDb,
  getBorrowMaterialById: getBorrowMaterialByIdDb,
  createBorrowMaterial: createBorrowMaterialDb,
  updateBorrowMaterial: updateBorrowMaterialDb,
  deleteBorrowMaterial: deleteBorrowMaterialDb,
} = require("../repositories");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler, NotFoundError } = require("../errors");

const listBorrowMaterials = asyncHandler(async (req, res) => {
  const materials = await listBorrowMaterialsDb();
  return success(res, materials);
});

const createBorrowMaterial = asyncHandler(async (req, res) => {
  const material = await createBorrowMaterialDb(req.body);
  return created(res, material);
});

const updateBorrowMaterial = asyncHandler(async (req, res) => {
  const existing = await getBorrowMaterialByIdDb(req.params.id);
  if (!existing) {
    throw new NotFoundError("Borrow material not found");
  }
  const material = await updateBorrowMaterialDb(req.params.id, req.body);
  if (!material) {
    throw new NotFoundError("Borrow material not found");
  }
  return success(res, material);
});

const deleteBorrowMaterial = asyncHandler(async (req, res) => {
  const existing = await getBorrowMaterialByIdDb(req.params.id);
  if (!existing) {
    throw new NotFoundError("Borrow material not found");
  }
  const deleted = await deleteBorrowMaterialDb(req.params.id);
  if (!deleted) {
    throw new NotFoundError("Borrow material not found");
  }
  return noContent(res);
});

module.exports = {
  listBorrowMaterials,
  createBorrowMaterial,
  updateBorrowMaterial,
  deleteBorrowMaterial,
};
