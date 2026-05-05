const {
  listBorrowMaterials: listBorrowMaterialsDb,
  getBorrowMaterialById: getBorrowMaterialByIdDb,
  createBorrowMaterial: createBorrowMaterialDb,
  updateBorrowMaterial: updateBorrowMaterialDb,
  deleteBorrowMaterial: deleteBorrowMaterialDb,
} = require("../repositories");
const { NotFoundError } = require("../errors");

async function listBorrowMaterials() {
  return listBorrowMaterialsDb();
}

async function createBorrowMaterial(payload) {
  return createBorrowMaterialDb(payload);
}

async function updateBorrowMaterial(materialId, payload) {
  const existing = await getBorrowMaterialByIdDb(materialId);
  if (!existing) throw new NotFoundError("Borrow material not found");
  const material = await updateBorrowMaterialDb(materialId, payload);
  if (!material) throw new NotFoundError("Borrow material not found");
  return material;
}

async function deleteBorrowMaterial(materialId) {
  const existing = await getBorrowMaterialByIdDb(materialId);
  if (!existing) throw new NotFoundError("Borrow material not found");
  const deleted = await deleteBorrowMaterialDb(materialId);
  if (!deleted) throw new NotFoundError("Borrow material not found");
}

module.exports = {
  listBorrowMaterials,
  createBorrowMaterial,
  updateBorrowMaterial,
  deleteBorrowMaterial,
};
