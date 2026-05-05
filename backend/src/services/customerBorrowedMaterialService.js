const {
  listCustomers: listCustomersDb,
  listCustomersByDepotId,
  listCustomersByOwnerUserId,
  getDepotByDepotUserId,
  getBorrowMaterialById,
  listCustomerBorrowedMaterialsByCustomer,
  listAllCustomerBorrowedMaterials,
  upsertCustomerBorrowedMaterial: upsertCustomerBorrowedMaterialDb,
  deleteCustomerBorrowedMaterial: deleteCustomerBorrowedMaterialDb,
} = require("../repositories");
const { BadRequestError, NotFoundError } = require("../errors");

async function getAllowedCustomers(user) {
  if (user.role === "Admin") return listCustomersDb();
  if (user.role === "Owner") return listCustomersByOwnerUserId(user.sub);
  if (user.role === "Depot") {
    const depot = await getDepotByDepotUserId(user.sub);
    if (!depot) return [];
    return listCustomersByDepotId(depot.id);
  }
  return [];
}

async function assertCustomerAccess(user, customerId) {
  const allowed = await getAllowedCustomers(user);
  const found = allowed.some((customer) => String(customer.id) === String(customerId));
  if (!found) throw new NotFoundError("Customer not found");
}

async function listAllBorrowed(user) {
  const allowed = await getAllowedCustomers(user);
  const allowedIds = new Set(allowed.map((customer) => String(customer.id)));
  const all = await listAllCustomerBorrowedMaterials();
  return user.role === "Admin" ? all : all.filter((row) => allowedIds.has(String(row.customerId)));
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
