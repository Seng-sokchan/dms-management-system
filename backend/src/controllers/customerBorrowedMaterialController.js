const customerBorrowedMaterialService = require("../services/customerBorrowedMaterialService");
const { success, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listAllBorrowed = asyncHandler(async (req, res) => {
  const filtered = await customerBorrowedMaterialService.listAllBorrowed(req.user);
  return success(res, filtered);
});

const listByCustomer = asyncHandler(async (req, res) => {
  const rows = await customerBorrowedMaterialService.listByCustomer(
    req.user,
    req.params.customerId,
  );
  return success(res, rows);
});

const upsertCustomerBorrow = asyncHandler(async (req, res) => {
  const row = await customerBorrowedMaterialService.upsertCustomerBorrow(
    req.user,
    req.params.customerId,
    req.body,
  );
  return success(res, row);
});

const deleteCustomerBorrow = asyncHandler(async (req, res) => {
  await customerBorrowedMaterialService.deleteCustomerBorrow(
    req.user,
    req.params.customerId,
    req.params.materialId,
  );
  return noContent(res);
});

module.exports = {
  listAllBorrowed,
  listByCustomer,
  upsertCustomerBorrow,
  deleteCustomerBorrow,
};
