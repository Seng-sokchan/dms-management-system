const {
  listCustomers: listCustomersDb,
  listCustomersByDepotId,
  listCustomersByOwnerUserId,
  getDepotByDepotUserId,
  getBorrowMaterialById,
  getOrderById,
  listAllBorrowMaterialOrderLoans,
  createBorrowMaterialOrderLoan: createBorrowMaterialOrderLoanDb,
  deleteBorrowMaterialOrderLoan: deleteBorrowMaterialOrderLoanDb,
  listAllBorrowMaterialMonthlySchedules,
  createBorrowMaterialMonthlySchedule: createBorrowMaterialMonthlyScheduleDb,
  getBorrowMaterialMonthlyScheduleById,
  listBorrowMaterialMonthlyInstallments,
  deleteBorrowMaterialMonthlySchedule: deleteBorrowMaterialMonthlyScheduleDb,
  updateBorrowMaterialMonthlyInstallmentStatus: updateBorrowMaterialMonthlyInstallmentStatusDb,
} = require("../repositories");
const { success, noContent } = require("../utils/response");
const { asyncHandler, BadRequestError, NotFoundError } = require("../errors");

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

const listAllOrderLoans = asyncHandler(async (req, res) => {
  const allowed = await getAllowedCustomers(req);
  const allowedIds = new Set(allowed.map((customer) => String(customer.id)));
  const all = await listAllBorrowMaterialOrderLoans();
  const filtered = req.user.role === "Admin"
    ? all
    : all.filter((row) => allowedIds.has(String(row.customerId)));
  return success(res, filtered);
});

const createOrderLoan = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const material = await getBorrowMaterialById(req.body.materialId);
  if (!material) {
    throw new BadRequestError("Borrow material not found");
  }
  const order = await getOrderById(req.body.orderId);
  if (!order) {
    throw new BadRequestError("Order not found");
  }
  if (String(order.customerId) !== String(req.params.customerId)) {
    throw new BadRequestError("Order does not belong to this customer");
  }
  try {
    const row = await createBorrowMaterialOrderLoanDb({
      customerId: req.params.customerId,
      materialId: req.body.materialId,
      orderId: req.body.orderId,
      fixedUnitPrice: req.body.fixedUnitPrice,
      note: req.body.note,
    });
    return success(res, row);
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      throw new BadRequestError("This order already has a borrow material loan");
    }
    throw err;
  }
});

const deleteOrderLoan = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const deleted = await deleteBorrowMaterialOrderLoanDb(req.params.customerId, req.params.id);
  if (!deleted) {
    throw new NotFoundError("Order loan not found");
  }
  return noContent(res);
});

const listAllMonthlySchedules = asyncHandler(async (req, res) => {
  const allowed = await getAllowedCustomers(req);
  const allowedIds = new Set(allowed.map((customer) => String(customer.id)));
  const all = await listAllBorrowMaterialMonthlySchedules();
  const filtered = req.user.role === "Admin"
    ? all
    : all.filter((row) => allowedIds.has(String(row.customerId)));
  return success(res, filtered);
});

const createMonthlySchedule = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const material = await getBorrowMaterialById(req.body.materialId);
  if (!material) {
    throw new BadRequestError("Borrow material not found");
  }
  const row = await createBorrowMaterialMonthlyScheduleDb({
    customerId: req.params.customerId,
    materialId: req.body.materialId,
    totalAmount: req.body.totalAmount,
    currency: req.body.currency,
    totalPeriod: req.body.totalPeriod,
    startDueDate: req.body.startDueDate,
    note: req.body.note,
  });
  return success(res, row);
});

const getMonthlyScheduleDetail = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const header = await getBorrowMaterialMonthlyScheduleById(
    req.params.scheduleId,
    req.params.customerId,
  );
  if (!header) {
    throw new NotFoundError("Schedule not found");
  }
  const installments = await listBorrowMaterialMonthlyInstallments(req.params.scheduleId);
  return success(res, { schedule: header, installments });
});

const deleteMonthlySchedule = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const deleted = await deleteBorrowMaterialMonthlyScheduleDb(req.params.customerId, req.params.id);
  if (!deleted) {
    throw new NotFoundError("Schedule not found");
  }
  return noContent(res);
});

const updateMonthlyInstallmentStatus = asyncHandler(async (req, res) => {
  await assertCustomerAccess(req, req.params.customerId);
  const status = Number(req.body.status);
  if (status !== 0 && status !== 1) {
    throw new BadRequestError("status must be 0 or 1");
  }
  const updated = await updateBorrowMaterialMonthlyInstallmentStatusDb({
    customerId: req.params.customerId,
    scheduleId: req.params.scheduleId,
    installmentId: req.params.installmentId,
    status,
  });
  if (!updated) {
    throw new NotFoundError("Installment not found");
  }
  return success(res, { ok: true });
});

module.exports = {
  listAllOrderLoans,
  createOrderLoan,
  deleteOrderLoan,
  listAllMonthlySchedules,
  createMonthlySchedule,
  getMonthlyScheduleDetail,
  deleteMonthlySchedule,
  updateMonthlyInstallmentStatus,
};
