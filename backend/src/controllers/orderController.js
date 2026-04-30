/**
 * Order HTTP controllers.
 *
 * Each handler is a thin wrapper around `orderService`:
 *   1. Pull validated data from req (already parsed by `validate()`).
 *   2. Pull caller identity from req.user.
 *   3. Call the service.
 *   4. Format the response with `success` / `created` / `noContent`.
 *
 * No Zod, no try/catch, no business logic, no repository imports.
 */
const orderService = require("../services/orderService");
const { success, created } = require("../utils/response");
const { asyncHandler } = require("../errors");

// Listing -------------------------------------------------------------------

const listOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.list({ user: req.user });
  return success(res, orders);
});

const listOrderGroups = asyncHandler(async (_req, res) => {
  const groups = await orderService.listGroups();
  return success(res, groups);
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

const confirmDelivery = asyncHandler(async (req, res) => {
  const order = await orderService.confirmDelivery(req.params.id, req.body);
  return success(res, order);
});

const deleteOrder = asyncHandler(async (req, res) => {
  const result = await orderService.remove(req.params.id);
  return success(res, result);
});

// Mobile --------------------------------------------------------------------

const mobileListOrders = asyncHandler(async (_req, res) => {
  const orders = await orderService.listForMobile();
  return success(res, orders, { meta: { count: orders.length } });
});

const mobileUpdateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatusForMobile(
    req.params.id,
    req.body.status,
    { user: req.user },
  );
  return success(res, order);
});

module.exports = {
  listStatuses,
  listOrderGroups,
  listOrders,
  createOrder,
  assignOrder,
  updateOrderStatus,
  confirmDelivery,
  dashboardSummary,
  deleteOrder,
  mobileListOrders,
  mobileUpdateStatus,
};
