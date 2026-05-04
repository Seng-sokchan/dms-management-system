/**
 * Order routes.
 *
 * Standard ordering of middleware on every route:
 *   requireAuth -> requireRoles -> validate -> controller
 *
 * Specific paths must come before more general ones (e.g.
 * `/orders/:id/status` before `/orders/:id`).
 */
const express = require("express");
const {
  listStatuses,
  listOrderGroups,
  listOrders,
  listOrderPaymentTotals,
  createOrder,
  assignOrder,
  updateOrderStatus,
  moveOrderStatus,
  confirmDelivery,
  dashboardSummary,
  deleteOrder,
  mobileListOrders,
  mobileUpdateStatus,
} = require("../controllers/orderController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createOrderSchema,
  assignOrderSchema,
  updateOrderStatusSchema,
  confirmDeliverySchema,
  orderIdParamsSchema,
} = require("../validators/order.validator");

const router = express.Router();

router.get("/statuses", requireAuth, listStatuses);
router.get("/order-groups", requireAuth, listOrderGroups);
router.get("/orders", requireAuth, listOrders);
router.get(
  "/orders/payment-totals",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  listOrderPaymentTotals,
);

router.post(
  "/orders",
  requireAuth,
  requireRoles("Admin", "Owner", "Customer"),
  validate({ body: createOrderSchema }),
  createOrder,
);

router.post(
  "/orders/:id/delivery-confirmation",
  requireAuth,
  requireRoles("Admin", "Logistics", "Delivery"),
  validate({ params: orderIdParamsSchema, body: confirmDeliverySchema }),
  confirmDelivery,
);

router.post(
  "/orders/:id/status",
  requireAuth,
  requireRoles("Admin", "Owner", "Logistics", "Delivery"),
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  updateOrderStatus,
);

router.post(
  "/orders/:id/move-status",
  requireAuth,
  requireRoles("Admin", "Owner", "Logistics", "Delivery"),
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  moveOrderStatus,
);

router.post(
  "/orders/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: orderIdParamsSchema, body: assignOrderSchema }),
  assignOrder,
);

router.delete(
  "/orders/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: orderIdParamsSchema }),
  deleteOrder,
);

router.get("/dashboard/summary", requireAuth, dashboardSummary);

router.get("/mobile/orders", requireAuth, mobileListOrders);
router.post(
  "/mobile/orders/:id/status",
  requireAuth,
  requireRoles("Admin", "Owner", "Logistics", "Delivery"),
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  mobileUpdateStatus,
);

module.exports = router;
