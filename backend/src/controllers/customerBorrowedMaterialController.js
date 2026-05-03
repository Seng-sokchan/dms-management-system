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
const { success, noContent } = require("../utils/response");
const {
  asyncHandler,
  BadRequestError,
  NotFoundError,
} = require("../errors");

async function getAllowedCustomers(req) {
  if (req.user.role === "Admin") {
    return listCustomersDb();
  }
  if (req.user.role === "Owner") {
    return listCustomersByOwnerUserId(req.user.sub);
  }
  if (req.user.role === "Depot") {
    const depot = await getDepotByDepotUserId(req.user.sub);
    if (!depot) return [];
    return listCustomersByDepotId(depot.id);
  }
  return [];
}

async function assertCustomerAccess(req, customerId) {
  const allowed = await getAllowedCustomers(req);
  const found = allowed.some((customer) => String(customer.id) === String(customerId));
  if (!found) {
    throw new NotFoundError("Customer not found");
  }
}

const listAllBorrowed = asyncHandler(async (req, res) => {
  const allowed = await getAllowedCustomers(req);
  const allowedIds = new Set(allowed.map((customer) => String(customer.id)));
  const all = await listAllCustomerBorrowedMaterials();
  const filtered = req.user.role === "Admin"
    ? all
    : all.filter((row) => allowedIds.has(String(row.customerId)));
  return success(res, filtered);
});

const listByCustomer = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const rows = await listCustomerBorrowedMaterialsByCustomer(req.params.customerId);
  return success(res, rows);
});

const upsertCustomerBorrow = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const material = await getBorrowMaterialById(req.body.materialId);
  if (!material) {
    throw new BadRequestError("Borrow material not found");
  }
  const row = await upsertCustomerBorrowedMaterialDb({
    customerId: req.params.customerId,
    materialId: req.body.materialId,
    qty: req.body.qty,
    note: req.body.note,
  });
  return success(res, row);
});

const deleteCustomerBorrow = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const deleted = await deleteCustomerBorrowedMaterialDb(req.params.customerId, req.params.materialId);
  if (!deleted) {
    throw new NotFoundError("Borrowed material not found");
  }
  return noContent(res);
});

module.exports = {
  listAllBorrowed,
  listByCustomer,
  upsertCustomerBorrow,
  deleteCustomerBorrow,
};
