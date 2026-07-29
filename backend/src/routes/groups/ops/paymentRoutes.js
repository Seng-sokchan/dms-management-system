const express = require("express");
const {
  createPaymentIntent,
  createBatchPaymentIntent,
  listUnpaidMasterOrders,
  createManualPayment,
  getPaymentAmountOptions,
  getPayment,
  getOrderPayment,
  cancelPayment,
  getCheckoutPage,
  submitPaywayPurchase,
  startPaymentLiveCheck,
  stopPaymentLiveCheck,
} = require("../../../controllers/paymentController");
const { requireAuth, requireRoles } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  createPaymentIntentSchema,
  createBatchPaymentIntentSchema,
  createManualPaymentSchema,
  paymentAmountOptionsSchema,
  paymentIdParamsSchema,
  orderIdPaymentParamsSchema,
} = require("../../../validators/payment.validator");

const router = express.Router();
const requireAdminPanel = requireRoles("Admin", "Owner");

router.post(
  "/payments/intents",
  requireAuth,
  validate({ body: createPaymentIntentSchema }),
  createPaymentIntent,
);

router.post(
  "/payments/batch-intents",
  requireAuth,
  validate({ body: createBatchPaymentIntentSchema }),
  createBatchPaymentIntent,
);

router.get(
  "/payments/unpaid-orders",
  requireAuth,
  requireAdminPanel,
  listUnpaidMasterOrders,
);

router.post(
  "/payments/manual",
  requireAuth,
  requireAdminPanel,
  validate({ body: createManualPaymentSchema }),
  createManualPayment,
);

router.post(
  "/payments/amount-options",
  requireAuth,
  validate({ body: paymentAmountOptionsSchema }),
  getPaymentAmountOptions,
);

router.get(
  "/payments/:paymentId/checkout-page",
  requireAuth,
  validate({ params: paymentIdParamsSchema }),
  getCheckoutPage,
);

router.post(
  "/payments/:paymentId/purchase",
  requireAuth,
  validate({ params: paymentIdParamsSchema }),
  submitPaywayPurchase,
);

router.get(
  "/payments/:paymentId",
  requireAuth,
  validate({ params: paymentIdParamsSchema }),
  getPayment,
);

router.get(
  "/orders/:orderId/payment",
  requireAuth,
  validate({ params: orderIdPaymentParamsSchema }),
  getOrderPayment,
);

router.post(
  "/payments/:paymentId/live-check/start",
  requireAuth,
  validate({ params: paymentIdParamsSchema }),
  startPaymentLiveCheck,
);

router.post(
  "/payments/:paymentId/live-check/stop",
  requireAuth,
  validate({ params: paymentIdParamsSchema }),
  stopPaymentLiveCheck,
);

router.post(
  "/payments/:paymentId/cancel",
  requireAuth,
  validate({ params: paymentIdParamsSchema }),
  cancelPayment,
);

module.exports = router;
