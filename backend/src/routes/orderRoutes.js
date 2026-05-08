/**
 * Order routes.
 *
 * Standard ordering of middleware on every route:
 *   requireAuth -> validate -> controller
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
  createOrderGroup,
  updateOrderGroup,
  deleteOrderGroup,
  assignOrder,
  updateOrderStatus,
  moveOrderStatus,
  confirmDelivery,
  dashboardSummary,
  deleteOrder,
  mobileListOrders,
  mobileUpdateStatus,
} = require("../controllers/orderController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createOrderSchema,
  assignOrderSchema,
  updateOrderStatusSchema,
  confirmDeliverySchema,
  orderIdParamsSchema,
} = require("../validators/order.validator");
const {
  orderGroupBodySchema,
  orderGroupIdParamsSchema,
} = require("../validators/orderGroup.validator");

const router = express.Router();

router.get("/statuses", requireAuth, listStatuses);
router.get("/order-groups", requireAuth, listOrderGroups);
router.get("/orders", requireAuth, listOrders);
router.get(
  "/orders/payment-totals",
  requireAuth,
  listOrderPaymentTotals,
);

router.post(
  "/order-groups",
  requireAuth,
  validate({ body: orderGroupBodySchema }),
  createOrderGroup,
);

router.post(
  "/order-groups/:id",
  requireAuth,
  validate({ params: orderGroupIdParamsSchema, body: orderGroupBodySchema }),
  updateOrderGroup,
);

router.delete(
  "/order-groups/:id",
  requireAuth,
  validate({ params: orderGroupIdParamsSchema }),
  deleteOrderGroup,
);

router.post(
  "/orders",
  requireAuth,
  validate({ body: createOrderSchema }),
  createOrder,
);

router.post(
  "/orders/:id/delivery-confirmation",
  requireAuth,
  validate({ params: orderIdParamsSchema, body: confirmDeliverySchema }),
  confirmDelivery,
);

router.post(
  "/orders/:id/status",
  requireAuth,
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  updateOrderStatus,
);

router.post(
  "/orders/:id/move-status",
  requireAuth,
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  moveOrderStatus,
);

router.post(
  "/orders/:id",
  requireAuth,
  validate({ params: orderIdParamsSchema, body: assignOrderSchema }),
  assignOrder,
);

router.delete(
  "/orders/:id",
  requireAuth,
  validate({ params: orderIdParamsSchema }),
  deleteOrder,
);

router.get("/dashboard/summary", requireAuth, dashboardSummary);

router.get("/mobile/orders", requireAuth, mobileListOrders);
router.post(
  "/mobile/orders/:id/status",
  requireAuth,
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  mobileUpdateStatus,
);

module.exports = router;
