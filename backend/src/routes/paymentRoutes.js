const express = require("express");
const {
  createPaymentIntent,
  getPayment,
  getOrderPayment,
  cancelPayment,
} = require("../controllers/paymentController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createPaymentIntentSchema,
  paymentIdParamsSchema,
  orderIdPaymentParamsSchema,
} = require("../validators/payment.validator");

const router = express.Router();

router.post(
  "/payments/intents",
  requireAuth,
  validate({ body: createPaymentIntentSchema }),
  createPaymentIntent,
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
  "/payments/:paymentId/cancel",
  requireAuth,
  validate({ params: paymentIdParamsSchema }),
  cancelPayment,
);

module.exports = router;
