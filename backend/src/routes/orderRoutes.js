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
  listOrders,
  listOrderPaymentTotals,
  createOrder,
  createOrderBatch,
  createDepotBatch,
  assignOrder,
  updateOrderStatus,
  moveOrderStatus,
  confirmDelivery,
  dashboardSummary,
  deleteOrder,
  mobileListOrders,
  mobileUpdateStatus,
  mobileConfirmDelivery,
} = require("../controllers/orderController");
const { mobileGetOrderDeliveryLocation } = require("../controllers/deliveryLocationController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createOrderSchema,
  createOrderBatchSchema,
  createDepotBatchSchema,
  assignOrderSchema,
  updateOrderStatusSchema,
  confirmDeliverySchema,
  orderIdParamsSchema,
} = require("../validators/order.validator");

const router = express.Router();

router.get("/statuses", requireAuth, listStatuses);
router.get("/orders", requireAuth, listOrders);
router.get(
  "/orders/payment-totals",
  requireAuth,
  listOrderPaymentTotals,
);

router.post(
  "/orders/batch",
  requireAuth,
  validate({ body: createOrderBatchSchema }),
  createOrderBatch,
);

router.post(
  "/orders/depot-batch",
  requireAuth,
  requireRoles("Depot", "Admin", "Owner"),
  validate({ body: createDepotBatchSchema }),
  createDepotBatch,
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
router.get(
  "/mobile/orders/:id/delivery-location",
  requireAuth,
  validate({ params: orderIdParamsSchema }),
  mobileGetOrderDeliveryLocation,
);
router.post(
  "/mobile/orders/:id/status",
  requireAuth,
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  mobileUpdateStatus,
);

router.post(
  "/mobile/orders/:id/delivery-confirmation",
  requireAuth,
  validate({ params: orderIdParamsSchema, body: confirmDeliverySchema }),
  mobileConfirmDelivery,
);

module.exports = router;
