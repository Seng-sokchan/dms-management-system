const {
  getBorrowMaterialById,
  listCustomerBorrowedMaterialsByCustomer,
  listAllCustomerBorrowedMaterials,
  upsertCustomerBorrowedMaterial: upsertCustomerBorrowedMaterialDb,
  deleteCustomerBorrowedMaterial: deleteCustomerBorrowedMaterialDb,
} = require("../repositories");
const {
  assertCustomerAccess,
  filterRowsByCustomerIds,
  getAllowedCustomerIds,
} = require("./accessScopeService");
const { BadRequestError, NotFoundError } = require("../errors");

async function listAllBorrowed(user) {
  const allowedIds = await getAllowedCustomerIds(user);
  const all = await listAllCustomerBorrowedMaterials();
  return filterRowsByCustomerIds(all, allowedIds);
}

async function listByCustomer(user, customerId) {
  await assertCustomerAccess(user, customerId);
  return listCustomerBorrowedMaterialsByCustomer(customerId);
}

async function upsertCustomerBorrow(user, customerId, payload) {
  await assertCustomerAccess(user, customerId);
  const material = await getBorrowMaterialById(payload.materialId);
  if (!material) throw new BadRequestError("Borrow material not found");
  return upsertCustomerBorrowedMaterialDb({
    customerId,
    materialId: payload.materialId,
    qty: payload.qty,
    note: payload.note,
  });
}

async function deleteCustomerBorrow(user, customerId, materialId) {
  await assertCustomerAccess(user, customerId);
  const deleted = await deleteCustomerBorrowedMaterialDb(customerId, materialId);
  if (!deleted) throw new NotFoundError("Borrowed material not found");
}

module.exports = {
  listAllBorrowed,
  listByCustomer,
  upsertCustomerBorrow,
  deleteCustomerBorrow,
};
