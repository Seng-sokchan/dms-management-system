const borrowMaterialLoansService = require("../services/borrowMaterialLoansService");
const { success, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listAllOrderLoans = asyncHandler(async (req, res) => {
  const filtered = await borrowMaterialLoansService.listAllOrderLoans(req.user);
  return success(res, filtered);
});

const createOrderLoan = asyncHandler(async (req, res) => {
  const row = await borrowMaterialLoansService.createOrderLoan(
    req.user,
    req.params.customerId,
    req.body,
  );
  return success(res, row);
});

const deleteOrderLoan = asyncHandler(async (req, res) => {
  await borrowMaterialLoansService.deleteOrderLoan(req.user, req.params.customerId, req.params.id);
  return noContent(res);
});

const listAllMonthlySchedules = asyncHandler(async (req, res) => {
  const filtered = await borrowMaterialLoansService.listAllMonthlySchedules(req.user);
  return success(res, filtered);
});

const createMonthlySchedule = asyncHandler(async (req, res) => {
  const row = await borrowMaterialLoansService.createMonthlySchedule(
    req.user,
    req.params.customerId,
    req.body,
  );
  return success(res, row);
});

const getMonthlyScheduleDetail = asyncHandler(async (req, res) => {
  const scheduleDetail = await borrowMaterialLoansService.getMonthlyScheduleDetail(
    req.user,
    req.params.customerId,
    req.params.scheduleId,
  );
  return success(res, scheduleDetail);
});

const deleteMonthlySchedule = asyncHandler(async (req, res) => {
  await borrowMaterialLoansService.deleteMonthlySchedule(
    req.user,
    req.params.customerId,
    req.params.id,
  );
  return noContent(res);
});

const updateMonthlyInstallmentStatus = asyncHandler(async (req, res) => {
  const result = await borrowMaterialLoansService.updateMonthlyInstallmentStatus(
    req.user,
    req.params,
    Number(req.body.status),
  );
  return success(res, result);
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
