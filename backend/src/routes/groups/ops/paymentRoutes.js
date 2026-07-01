const express = require("express");
const {
  createPaymentIntent,
  createBatchPaymentIntent,
  getPayment,
  getOrderPayment,
  cancelPayment,
  getCheckoutPage,
  startPaymentLiveCheck,
  stopPaymentLiveCheck,
} = require("../../../controllers/paymentController");
const { requireAuth } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  createPaymentIntentSchema,
  createBatchPaymentIntentSchema,
  paymentIdParamsSchema,
  orderIdPaymentParamsSchema,
} = require("../../../validators/payment.validator");

const router = express.Router();

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
  "/payments/:paymentId/checkout-page",
  requireAuth,
  validate({ params: paymentIdParamsSchema }),
  getCheckoutPage,
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
