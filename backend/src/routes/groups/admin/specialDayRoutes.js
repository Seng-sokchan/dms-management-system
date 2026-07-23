const express = require("express");
const {
  listSpecialDays,
  listOpenSpecialDays,
  getSpecialDay,
  createSpecialDay,
  updateSpecialDay,
  listRegistrations,
  listMyRegistrations,
  registerForSpecialDay,
  cancelRegistration,
  upsertAssignment,
  listDriverAssignments,
  acceptAssignment,
  getProgress,
  createDelivery,
} = require("../../../controllers/specialDayController");
const { requireAuth, requireRoles } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  idParamsSchema,
  registrationIdParamsSchema,
  acceptAssignmentParamsSchema,
  createSpecialDaySchema,
  updateSpecialDaySchema,
  upsertAssignmentSchema,
  createDeliverySchema,
  listRegistrationsQuerySchema,
} = require("../../../validators/specialDay.validator");

const router = express.Router();
const requireAdminPanel = requireRoles("Admin", "Owner");

router.get("/special-days", requireAuth, requireAdminPanel, listSpecialDays);
router.post(
  "/special-days",
  requireAuth,
  requireAdminPanel,
  validate({ body: createSpecialDaySchema }),
  createSpecialDay,
);
router.get(
  "/special-days/open",
  requireAuth,
  requireRoles("Customer", "Depot", "Admin", "Owner"),
  listOpenSpecialDays,
);
router.get(
  "/special-days/my-registrations",
  requireAuth,
  requireRoles("Customer", "Depot"),
  listMyRegistrations,
);
router.get(
  "/mobile/special-days/active/assignments",
  requireAuth,
  requireRoles("Delivery"),
  listDriverAssignments,
);
router.post(
  "/mobile/special-days/assignments/:registrationId/accept",
  requireAuth,
  requireRoles("Delivery"),
  validate({ params: acceptAssignmentParamsSchema }),
  acceptAssignment,
);
router.post(
  "/mobile/special-days/deliveries",
  requireAuth,
  requireRoles("Delivery"),
  validate({ body: createDeliverySchema }),
  createDelivery,
);
router.get(
  "/special-days/:id",
  requireAuth,
  requireAdminPanel,
  validate({ params: idParamsSchema }),
  getSpecialDay,
);
router.patch(
  "/special-days/:id",
  requireAuth,
  requireAdminPanel,
  validate({ params: idParamsSchema, body: updateSpecialDaySchema }),
  updateSpecialDay,
);
router.get(
  "/special-days/:id/registrations",
  requireAuth,
  requireAdminPanel,
  validate({ params: idParamsSchema, query: listRegistrationsQuerySchema }),
  listRegistrations,
);
router.post(
  "/special-days/:id/registrations",
  requireAuth,
  requireRoles("Customer", "Depot"),
  validate({ params: idParamsSchema }),
  registerForSpecialDay,
);
router.delete(
  "/special-days/:id/registrations/:registrationId",
  requireAuth,
  requireRoles("Customer", "Depot", "Admin", "Owner"),
  validate({ params: registrationIdParamsSchema }),
  cancelRegistration,
);
router.put(
  "/special-days/:id/assignments",
  requireAuth,
  requireAdminPanel,
  validate({ params: idParamsSchema, body: upsertAssignmentSchema }),
  upsertAssignment,
);
router.get(
  "/special-days/:id/progress",
  requireAuth,
  requireAdminPanel,
  validate({ params: idParamsSchema }),
  getProgress,
);

module.exports = router;
