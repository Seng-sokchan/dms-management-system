/**
 * Order HTTP controllers.
 *
 * Each handler is a thin wrapper around `orderService`:
 *   1. Pull validated data from req (already parsed by `validate()`).
 *   2. Pull caller identity from req.user.
 *   3. Call the service.
 *   4. Format the response with `success` / `created`.
 *
 * No Zod, no try/catch, no business logic, no repository imports.
 */
const orderService = require("../services/orderService");
const paymentTotalsService = require("../services/paymentTotalsService");
const { success, created } = require("../utils/response");
const { asyncHandler } = require("../errors");

// Listing -------------------------------------------------------------------

const listOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.list({ user: req.user });
  return success(res, orders);
});

const listOrderPaymentTotals = asyncHandler(async (req, res) => {
  const data = await paymentTotalsService.listOrderPaymentTotals({ user: req.user });
  return success(res, data);
});

const listStatuses = asyncHandler(async (_req, res) => {
  const statuses = await orderService.listStatuses();
  return success(res, statuses);
});

const dashboardSummary = asyncHandler(async (_req, res) => {
  const summary = await orderService.getDashboardSummary();
  return success(res, summary);
});

// Mutations -----------------------------------------------------------------

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.create(req.body);
  return created(res, order);
});

const createOrderBatch = asyncHandler(async (req, res) => {
  const orders = await orderService.createBatch(req.body);
  return created(res, orders);
});

const createDepotBatch = asyncHandler(async (req, res) => {
  const orders = await orderService.createDepotBatch({
    user: req.user,
    lines: req.body.lines,
  });
  return created(res, orders);
});

const assignOrder = asyncHandler(async (req, res) => {
  const order = await orderService.assign(req.params.id, req.body);
  return success(res, order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body.status, {
    user: req.user,
  });
  return success(res, order);
});

const moveOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body.status, {
    user: req.user,
    allowReverse: true,
  });
  return success(res, order);
});

const confirmDelivery = asyncHandler(async (req, res) => {
  const order = await orderService.confirmDelivery(req.params.id);
  return success(res, order);
});

const deleteOrder = asyncHandler(async (req, res) => {
  const result = await orderService.remove(req.params.id);
  return success(res, result);
});

// Mobile --------------------------------------------------------------------

const mobileListOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listForMobile({ user: req.user });
  return success(res, orders, { meta: { count: orders.length } });
});

const mobileUpdateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatusForMobile(req.params.id, req.body.status, {
    user: req.user,
  });
  return success(res, order);
});

module.exports = {
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
};
