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

async function listAllOrderLoans(user) {
  const allowed = await getAllowedCustomers(user);
  const allowedIds = new Set(allowed.map((customer) => String(customer.id)));
  const all = await listAllBorrowMaterialOrderLoans();
  return user.role === "Admin" ? all : all.filter((row) => allowedIds.has(String(row.customerId)));
}

async function createOrderLoan(user, customerId, payload) {
  await assertCustomerAccess(user, customerId);
  const material = await getBorrowMaterialById(payload.materialId);
  if (!material) throw new BadRequestError("Borrow material not found");
  const order = await getOrderById(payload.orderId);
  if (!order) throw new BadRequestError("Order not found");
  if (String(order.customerId) !== String(customerId)) {
    throw new BadRequestError("Order does not belong to this customer");
  }
  try {
    return await createBorrowMaterialOrderLoanDb({
      customerId,
      materialId: payload.materialId,
      orderId: payload.orderId,
      fixedUnitPrice: payload.fixedUnitPrice,
      note: payload.note,
    });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      throw new BadRequestError("This order already has a borrow material loan");
    }
    throw err;
  }
}

async function deleteOrderLoan(user, customerId, id) {
  await assertCustomerAccess(user, customerId);
  const deleted = await deleteBorrowMaterialOrderLoanDb(customerId, id);
  if (!deleted) throw new NotFoundError("Order loan not found");
}

async function listAllMonthlySchedules(user) {
  const allowed = await getAllowedCustomers(user);
  const allowedIds = new Set(allowed.map((customer) => String(customer.id)));
  const all = await listAllBorrowMaterialMonthlySchedules();
  return user.role === "Admin" ? all : all.filter((row) => allowedIds.has(String(row.customerId)));
}

async function createMonthlySchedule(user, customerId, payload) {
  await assertCustomerAccess(user, customerId);
  const material = await getBorrowMaterialById(payload.materialId);
  if (!material) throw new BadRequestError("Borrow material not found");
  return createBorrowMaterialMonthlyScheduleDb({
    customerId,
    materialId: payload.materialId,
    totalAmount: payload.totalAmount,
    currency: payload.currency,
    totalPeriod: payload.totalPeriod,
    startDueDate: payload.startDueDate,
    note: payload.note,
  });
}

async function getMonthlyScheduleDetail(user, customerId, scheduleId) {
  await assertCustomerAccess(user, customerId);
  const schedule = await getBorrowMaterialMonthlyScheduleById(scheduleId, customerId);
  if (!schedule) throw new NotFoundError("Schedule not found");
  const installments = await listBorrowMaterialMonthlyInstallments(scheduleId);
  return { schedule, installments };
}

async function deleteMonthlySchedule(user, customerId, id) {
  await assertCustomerAccess(user, customerId);
  const deleted = await deleteBorrowMaterialMonthlyScheduleDb(customerId, id);
  if (!deleted) throw new NotFoundError("Schedule not found");
}

async function updateMonthlyInstallmentStatus(user, params, status) {
  await assertCustomerAccess(user, params.customerId);
  if (status !== 0 && status !== 1) throw new BadRequestError("status must be 0 or 1");
  const updated = await updateBorrowMaterialMonthlyInstallmentStatusDb({
    customerId: params.customerId,
    scheduleId: params.scheduleId,
    installmentId: params.installmentId,
    status,
  });
  if (!updated) throw new NotFoundError("Installment not found");
  return { ok: true };
}

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
