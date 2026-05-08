const express = require("express");
const {
  listAllOrderLoans,
  createOrderLoan,
  deleteOrderLoan,
  listAllMonthlySchedules,
  createMonthlySchedule,
  getMonthlyScheduleDetail,
  deleteMonthlySchedule,
  updateMonthlyInstallmentStatus,
} = require("../controllers/borrowMaterialLoansController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createBorrowMaterialOrderLoanBodySchema,
  customerBorrowOrderLoanParamsSchema,
  customerBorrowOrderLoanDeleteParamsSchema,
} = require("../validators/borrowMaterialOrderLoan.validator");
const {
  createBorrowMaterialMonthlyScheduleBodySchema,
  customerBorrowMonthlyScheduleParamsSchema,
  customerBorrowMonthlyScheduleDetailParamsSchema,
  customerBorrowMonthlyScheduleDeleteParamsSchema,
  customerBorrowMonthlyInstallmentStatusParamsSchema,
  updateBorrowMaterialMonthlyInstallmentStatusBodySchema,
} = require("../validators/borrowMaterialMonthlySchedule.validator");

const router = express.Router();

router.get(
  "/customer-borrow-material-order-loans",
  requireAuth,
  listAllOrderLoans,
);
router.post(
  "/customers/:customerId/borrow-material-order-loans",
  requireAuth,
  validate({
    params: customerBorrowOrderLoanParamsSchema,
    body: createBorrowMaterialOrderLoanBodySchema,
  }),
  createOrderLoan,
);
router.delete(
  "/customers/:customerId/borrow-material-order-loans/:id",
  requireAuth,
  validate({ params: customerBorrowOrderLoanDeleteParamsSchema }),
  deleteOrderLoan,
);

router.get(
  "/customer-borrow-material-monthly-schedules",
  requireAuth,
  listAllMonthlySchedules,
);
router.post(
  "/customers/:customerId/borrow-material-monthly-schedules",
  requireAuth,
  validate({
    params: customerBorrowMonthlyScheduleParamsSchema,
    body: createBorrowMaterialMonthlyScheduleBodySchema,
  }),
  createMonthlySchedule,
);
router.get(
  "/customers/:customerId/borrow-material-monthly-schedules/:scheduleId",
  requireAuth,
  validate({ params: customerBorrowMonthlyScheduleDetailParamsSchema }),
  getMonthlyScheduleDetail,
);
router.patch(
  "/customers/:customerId/borrow-material-monthly-schedules/:scheduleId/installments/:installmentId",
  requireAuth,
  validate({
    params: customerBorrowMonthlyInstallmentStatusParamsSchema,
    body: updateBorrowMaterialMonthlyInstallmentStatusBodySchema,
  }),
  updateMonthlyInstallmentStatus,
);
router.delete(
  "/customers/:customerId/borrow-material-monthly-schedules/:id",
  requireAuth,
  validate({ params: customerBorrowMonthlyScheduleDeleteParamsSchema }),
  deleteMonthlySchedule,
);

module.exports = router;
