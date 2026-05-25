const paymentService = require("../services/paymentService");
const { success, created } = require("../utils/response");
const { asyncHandler } = require("../errors");

const createPaymentIntent = asyncHandler(async (req, res) => {
  const data = await paymentService.createPaymentIntent(req.body, { user: req.user });
  return created(res, data);
});

const getPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentById(req.params.paymentId, { user: req.user });
  return success(res, data);
});

const getOrderPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.getLatestPaymentForOrder(req.params.orderId, { user: req.user });
  return success(res, data);
});

const cancelPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.cancelPayment(req.params.paymentId, { user: req.user });
  return success(res, data);
});

module.exports = {
  createPaymentIntent,
  getPayment,
  getOrderPayment,
  cancelPayment,
};
