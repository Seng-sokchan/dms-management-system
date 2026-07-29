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

const createBatchPaymentIntent = asyncHandler(async (req, res) => {
  const data = await paymentService.createBatchPaymentIntent(req.body, { user: req.user });
  return created(res, data);
});

const listUnpaidMasterOrders = asyncHandler(async (req, res) => {
  const data = await paymentService.listUnpaidMasterOrdersForManual({ user: req.user });
  return success(res, data);
});

const createManualPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.createManualPayment(req.body, { user: req.user });
  return created(res, data);
});

const getPaymentAmountOptions = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentAmountOptions(req.body, { user: req.user });
  return success(res, data);
});

const getCheckoutPage = asyncHandler(async (req, res) => {
  const html = await paymentService.getCheckoutPage(req.params.paymentId, { user: req.user });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(html);
});

const submitPaywayPurchase = asyncHandler(async (req, res) => {
  const data = await paymentService.submitPaywayPurchase(req.params.paymentId, { user: req.user });
  return success(res, data);
});

const startPaymentLiveCheck = asyncHandler(async (req, res) => {
  const data = await paymentService.startPaymentLiveCheck(req.params.paymentId, { user: req.user });
  return success(res, data);
});

const stopPaymentLiveCheck = asyncHandler(async (req, res) => {
  const data = await paymentService.stopPaymentLiveCheck(req.params.paymentId, { user: req.user });
  return success(res, data);
});

module.exports = {
  createPaymentIntent,
  createBatchPaymentIntent,
  listUnpaidMasterOrders,
  createManualPayment,
  getPaymentAmountOptions,
  getPayment,
  getOrderPayment,
  getCheckoutPage,
  submitPaywayPurchase,
  startPaymentLiveCheck,
  stopPaymentLiveCheck,
  cancelPayment,
};
