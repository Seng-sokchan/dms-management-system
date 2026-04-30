/**
 * Order domain service.
 *
 * Holds all business rules for orders: lookups, transitions, derivations,
 * authorization scoping. Knows nothing about Express — receives plain
 * arguments, returns plain values, throws typed AppError subclasses.
 *
 * Controllers in `controllers/orderController.js` are thin wrappers around
 * these functions.
 */
const { NEXT_STATUS, ORDER_STATUS } = require("../constants");
const orderRepository = require("../repositories/orders");
const orderGroupRepository = require("../repositories/orderGroups");
const customerRepository = require("../repositories/customers");
const itemRepository = require("../repositories/items");
const truckRepository = require("../repositories/trucks");
const lookupRepository = require("../repositories/lookups");
const overviewRepository = require("../repositories/overview");
const { BadRequestError, NotFoundError } = require("../errors");

// ---------------------------------------------------------------------------
// Status helpers (pure)
// ---------------------------------------------------------------------------

function getNextAllowedStatuses(currentStatus, orderedStatuses = ORDER_STATUS) {
  if (Array.isArray(orderedStatuses) && orderedStatuses.length > 1) {
    const currentIndex = orderedStatuses.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < orderedStatuses.length - 1) {
      return [orderedStatuses[currentIndex + 1]];
    }
    if (currentIndex === orderedStatuses.length - 1) {
      return [];
    }
  }
  return NEXT_STATUS[currentStatus] || [];
}

async function getStatusNames() {
  const rows = await lookupRepository.listOrderStatuses();
  return rows.map((row) => row.name);
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

/**
 * List orders, scoped by caller. Customers see only their own orders.
 */
async function list({ user } = {}) {
  const orders = await orderRepository.listOrders();
  if (user?.role !== "Customer") return orders;

  const customer = await customerRepository.getCustomerByUserId(user.sub);
  if (!customer) return [];
  return orders.filter((row) => String(row.customerId) === String(customer.id));
}

async function listGroups() {
  return orderGroupRepository.listOrderGroups();
}

async function listStatuses() {
  return lookupRepository.listOrderStatuses();
}

async function getDashboardSummary() {
  return overviewRepository.getDashboardSummary();
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create an order. Validates referenced entities exist and resolves the
 * unit price from the catalog when not provided.
 */
async function create(payload) {
  const customer = await customerRepository.getCustomerById(payload.customerId);
  if (!customer) throw new BadRequestError("Customer not found");

  const item = await itemRepository.getItemById(payload.itemId);
  if (!item) throw new BadRequestError("Item not found");

  if (payload.truckId) {
    const truck = await truckRepository.getTruckById(payload.truckId);
    if (!truck) throw new BadRequestError("Truck not found");
  }

  const unitPrice = payload.unitPrice ?? item.defaultUnitPriceUsd;

  return orderRepository.createOrder({
    customerId: payload.customerId,
    addressId: customer.address,
    itemId: payload.itemId,
    orderedQty: payload.orderedQty,
    unitPrice,
    producerId: payload.producerId ?? null,
    truckId: payload.truckId ?? null,
  });
}

/**
 * Assign an order to a producer/truck/group. Validates targets exist.
 */
async function assign(orderId, payload) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (payload.truckId) {
    const truck = await truckRepository.getTruckById(payload.truckId);
    if (!truck) throw new BadRequestError("Truck not found");
  }
  if (payload.orderGroupId) {
    const orderGroup = await orderGroupRepository.getOrderGroupById(payload.orderGroupId);
    if (!orderGroup) throw new BadRequestError("Order group not found");
  }

  return orderRepository.updateOrderAssignment(orderId, payload);
}

/**
 * Move an order to the given status. Validates the status exists.
 */
async function updateStatus(orderId, nextStatus, { user }) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  const validStatuses = await getStatusNames();
  if (!validStatuses.includes(nextStatus)) {
    throw new BadRequestError("Invalid status");
  }

  return orderRepository.updateOrderStatus(orderId, nextStatus, {
    changedByUserId: user?.sub ?? null,
  });
}

/**
 * Confirm a delivery. Enforces the qty arithmetic invariant:
 * delivered + loss + remaining <= ordered.
 */
async function confirmDelivery(orderId, payload) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  const total = payload.deliveredQty + payload.lossQty + payload.remainingQty;
  if (total > order.orderedQty) {
    throw new BadRequestError(
      "Invalid quantities: delivered + loss + remaining cannot exceed ordered quantity",
      { orderedQty: order.orderedQty, total },
    );
  }

  return orderRepository.confirmOrderDelivery(
    orderId,
    payload.deliveredQty,
    payload.lossQty,
    payload.remainingQty,
    payload.deliveryProofType,
    payload.deliveryProofValue,
  );
}

/**
 * Delete an order. Only NEW_ORDER is deletable.
 */
async function remove(orderId) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.status !== "NEW_ORDER") {
    throw new BadRequestError("Only NEW_ORDER can be deleted");
  }

  const result = await orderRepository.deleteOrder(orderId);
  if (!result || result.affectedRows === 0) {
    throw new NotFoundError("Order not found");
  }
  return { id: orderId };
}

// ---------------------------------------------------------------------------
// Mobile-specific helpers (kept narrow on purpose)
// ---------------------------------------------------------------------------

async function listForMobile() {
  return orderRepository.listOrders();
}

async function updateStatusForMobile(orderId, nextStatus, { user }) {
  return updateStatus(orderId, nextStatus, { user });
}

module.exports = {
  // pure helpers
  getNextAllowedStatuses,
  getStatusNames,
  // queries
  list,
  listGroups,
  listStatuses,
  getDashboardSummary,
  listForMobile,
  // mutations
  create,
  assign,
  updateStatus,
  confirmDelivery,
  remove,
  updateStatusForMobile,
};
