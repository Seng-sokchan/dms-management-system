const express = require("express");
const {
  listAllOrderLoans,
  createOrderLoan,
  deleteOrderLoan,
  listAllMonthlySchedules,
  createMonthlySchedule,
  getMonthlyScheduleDetail,
  deleteMonthlySchedule,
} = require("../controllers/borrowMaterialLoansController");
const { requireAuth, requireRoles } = require("../middleware/auth");
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
} = require("../validators/borrowMaterialMonthlySchedule.validator");

const router = express.Router();

router.get(
  "/customer-borrow-material-order-loans",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  listAllOrderLoans,
);
router.post(
  "/customers/:customerId/borrow-material-order-loans",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({
    params: customerBorrowOrderLoanParamsSchema,
    body: createBorrowMaterialOrderLoanBodySchema,
  }),
  createOrderLoan,
);
router.delete(
  "/customers/:customerId/borrow-material-order-loans/:id",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ params: customerBorrowOrderLoanDeleteParamsSchema }),
  deleteOrderLoan,
);

router.get(
  "/customer-borrow-material-monthly-schedules",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  listAllMonthlySchedules,
);
router.post(
  "/customers/:customerId/borrow-material-monthly-schedules",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({
    params: customerBorrowMonthlyScheduleParamsSchema,
    body: createBorrowMaterialMonthlyScheduleBodySchema,
  }),
  createMonthlySchedule,
);
router.get(
  "/customers/:customerId/borrow-material-monthly-schedules/:scheduleId",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ params: customerBorrowMonthlyScheduleDetailParamsSchema }),
  getMonthlyScheduleDetail,
);
router.delete(
  "/customers/:customerId/borrow-material-monthly-schedules/:id",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ params: customerBorrowMonthlyScheduleDeleteParamsSchema }),
  deleteMonthlySchedule,
);

module.exports = router;
