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
const depotRepository = require("../repositories/depots");
const itemRepository = require("../repositories/items");
const customerItemPriceRepository = require("../repositories/customerItemPrices");
const deliveryAgentRepository = require("../repositories/deliveryAgents");
const producerRepository = require("../repositories/producers");
const lookupRepository = require("../repositories/lookups");
const overviewRepository = require("../repositories/overview");
const { getPool } = require("../db/pool");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../errors");

/** New orders always use this producer; delivery agent is set later via assign. */
const DEFAULT_NEW_ORDER_PRODUCER_ID = "1";

const PENDING_ORDERS_MESSAGE =
  "Complete all previous orders (delivered to customer) before placing new orders.";

const STATUS_UPDATE_ROLES = new Set(["Admin", "Owner", "Logistics", "Delivery"]);
const STATUS_OWNER_BY_TARGET = {
  Owner_Preparing: new Set(["Admin", "Owner"]),
  Sent_To_Factory: new Set(["Admin", "Owner"]),
  Ready_For_Delivery: new Set(["Admin", "Owner", "Logistics", "Delivery"]),
  Recieve_By_Customer: new Set(["Admin", "Delivery"]),
};

// ---------------------------------------------------------------------------
// Status helpers (pure)
// ---------------------------------------------------------------------------

function getNextAllowedStatuses(currentStatus, orderedStatuses = ORDER_STATUS) {
  const mapped = NEXT_STATUS[currentStatus];
  if (Array.isArray(mapped)) return mapped;
  if (Array.isArray(orderedStatuses) && orderedStatuses.length > 1) {
    const currentIndex = orderedStatuses.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < orderedStatuses.length - 1) {
      return [orderedStatuses[currentIndex + 1]];
    }
    if (currentIndex === orderedStatuses.length - 1) {
      return [];
    }
  }
  return [];
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

async function createOrderGroup(payload) {
  return orderGroupRepository.createOrderGroup(payload);
}

async function updateOrderGroup(orderGroupId, payload) {
  const row = await orderGroupRepository.updateOrderGroup(orderGroupId, payload);
  if (!row) throw new NotFoundError("Order group not found");
  return row;
}

async function deleteOrderGroup(orderGroupId) {
  const deleted = await orderGroupRepository.deleteOrderGroup(orderGroupId);
  if (!deleted) throw new NotFoundError("Order group not found");
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

async function assertNoNonTerminalOrdersForCustomer(customerId, executor) {
  const n = await orderRepository.countNonTerminalOrdersByCustomer(customerId, executor);
  if (n > 0) {
    throw new BadRequestError(PENDING_ORDERS_MESSAGE);
  }
}

/**
 * Create an order. Validates referenced entities exist and resolves the
 * unit price from customer-item mapping when not provided.
 */
async function create(payload) {
  const customer = await customerRepository.getCustomerById(payload.customerId);
  if (!customer) throw new BadRequestError("Customer not found");

  await assertNoNonTerminalOrdersForCustomer(payload.customerId);

  const item = await itemRepository.getItemById(payload.itemId);
  if (!item) throw new BadRequestError("Item not found");

  const producer = await producerRepository.getProducerById(DEFAULT_NEW_ORDER_PRODUCER_ID);
  if (!producer) throw new BadRequestError("Default producer not found");

  const currency = String(payload.currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
  const mappedPrice = await customerItemPriceRepository.getCustomerItemPrice(
    payload.customerId,
    payload.itemId,
    currency,
  );
  const unitPrice = payload.unitPrice ?? mappedPrice?.unitPrice;
  if (unitPrice == null) {
    throw new BadRequestError("Customer item price not found");
  }

  return orderRepository.createOrder({
    customerId: payload.customerId,
    addressId: customer.address,
    itemId: payload.itemId,
    orderedQty: payload.orderedQty,
    unitPrice,
    currency,
    producerId: DEFAULT_NEW_ORDER_PRODUCER_ID,
  });
}

/**
 * Create multiple orders for one customer in a single transaction.
 * Same validation as {@link create} per line; fails entirely if any line is invalid
 * or the customer has non-terminal orders at commit time.
 */
async function createBatch({ customerId, lines }) {
  const producer = await producerRepository.getProducerById(DEFAULT_NEW_ORDER_PRODUCER_ID);
  if (!producer) throw new BadRequestError("Default producer not found");

  const customer = await customerRepository.getCustomerById(customerId);
  if (!customer) throw new BadRequestError("Customer not found");

  const rowsToInsert = [];
  for (const line of lines) {
    const item = await itemRepository.getItemById(line.itemId);
    if (!item) throw new BadRequestError("Item not found");

    const currency = String(line.currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
    const mappedPrice = await customerItemPriceRepository.getCustomerItemPrice(
      customerId,
      line.itemId,
      currency,
    );
    const unitPrice = line.unitPrice ?? mappedPrice?.unitPrice;
    if (unitPrice == null) {
      throw new BadRequestError("Customer item price not found");
    }

    rowsToInsert.push({
      customerId,
      addressId: customer.address,
      itemId: line.itemId,
      orderedQty: line.orderedQty,
      unitPrice,
      currency,
      producerId: DEFAULT_NEW_ORDER_PRODUCER_ID,
    });
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await assertNoNonTerminalOrdersForCustomer(customerId, conn);

    const orders = [];
    for (const row of rowsToInsert) {
      orders.push(await orderRepository.createOrder(row, conn));
    }
    await conn.commit();
    return orders;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Create orders across multiple customers in a single transaction.
 *
 * Intended for the Depot mobile flow: a Depot user prepares a batch that
 * contains lines for any number of customers belonging to their depot. The
 * service forces depot scoping for Depot callers (every customerId in the
 * payload must belong to the caller's depot). Admin/Owner callers may target
 * any customer. Each customer must still satisfy `assertNoNonTerminalOrdersForCustomer`.
 */
async function createDepotBatch({ user, lines }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new BadRequestError("At least one line is required");
  }

  const role = user?.role;
  if (role !== "Depot" && role !== "Admin" && role !== "Owner") {
    throw new ForbiddenError("Forbidden for this role");
  }

  let depot = null;
  if (role === "Depot") {
    depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot) {
      throw new ForbiddenError("Your account is not linked to a depot");
    }
  }

  const producer = await producerRepository.getProducerById(DEFAULT_NEW_ORDER_PRODUCER_ID);
  if (!producer) throw new BadRequestError("Default producer not found");

  // Resolve every customer once.
  const uniqueCustomerIds = [...new Set(lines.map((l) => String(l.customerId)))];
  const customersById = new Map();
  for (const customerId of uniqueCustomerIds) {
    const customer = await customerRepository.getCustomerById(customerId);
    if (!customer) {
      throw new BadRequestError(`Customer ${customerId} not found`);
    }
    if (role === "Depot" && String(customer.depotId || "") !== String(depot.id)) {
      throw new ForbiddenError(
        `Customer ${customerId} does not belong to your depot`,
      );
    }
    customersById.set(String(customerId), customer);
  }

  // Resolve every line (item exists, price known) before opening a transaction.
  const rowsToInsert = [];
  for (const line of lines) {
    const customer = customersById.get(String(line.customerId));
    const item = await itemRepository.getItemById(line.itemId);
    if (!item) throw new BadRequestError(`Item ${line.itemId} not found`);

    const currency = String(line.currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
    const mappedPrice = await customerItemPriceRepository.getCustomerItemPrice(
      line.customerId,
      line.itemId,
      currency,
    );
    const unitPrice = line.unitPrice ?? mappedPrice?.unitPrice;
    if (unitPrice == null) {
      throw new BadRequestError(
        `Customer item price not found for customer ${line.customerId} and item ${line.itemId}`,
      );
    }

    rowsToInsert.push({
      customerId: String(line.customerId),
      addressId: customer.address,
      itemId: line.itemId,
      orderedQty: line.orderedQty,
      unitPrice,
      currency,
      producerId: DEFAULT_NEW_ORDER_PRODUCER_ID,
    });
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const customerId of uniqueCustomerIds) {
      await assertNoNonTerminalOrdersForCustomer(customerId, conn);
    }

    const orders = [];
    for (const row of rowsToInsert) {
      orders.push(await orderRepository.createOrder(row, conn));
    }
    await conn.commit();
    return orders;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Assign an order to a producer/delivery agent/group. Validates targets exist.
 */
async function assign(orderId, payload) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (payload.deliveryAgentId) {
    const agent = await deliveryAgentRepository.getDeliveryAgentById(payload.deliveryAgentId);
    if (!agent) throw new BadRequestError("Delivery agent not found");
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
async function updateStatus(orderId, nextStatus, { user, allowReverse = false } = {}) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (!STATUS_UPDATE_ROLES.has(user?.role)) {
    throw new ForbiddenError("Forbidden for this role");
  }

  if (user?.role === "Delivery") {
    const agentId = user.deliveryAgentId != null && String(user.deliveryAgentId).trim() !== "" ? String(user.deliveryAgentId) : "";
    if (!agentId) {
      throw new ForbiddenError("Delivery account is not linked to a delivery agent");
    }
    if (String(order.deliveryAgentId || "") !== agentId) {
      throw new ForbiddenError("Forbidden for this order");
    }
  }

  const validStatuses = await getStatusNames();
  if (!validStatuses.includes(nextStatus)) {
    throw new BadRequestError("Invalid status");
  }

  if (!allowReverse) {
    const allowedNextStatuses = getNextAllowedStatuses(order.status, validStatuses);
    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new BadRequestError("Invalid status transition", {
        currentStatus: order.status,
        requestedStatus: nextStatus,
        allowedNextStatuses,
      });
    }
  }

  const allowedRolesForTarget = STATUS_OWNER_BY_TARGET[nextStatus];
  if (allowedRolesForTarget && !allowedRolesForTarget.has(user?.role)) {
    throw new ForbiddenError("You cannot move the order to this status");
  }

  return orderRepository.updateOrderStatus(orderId, nextStatus, {
    changedByUserId: user?.sub ?? null,
  });
}

/**
 * Confirm a delivery: moves the order to Recieve_By_Customer.
 */
async function confirmDelivery(orderId) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  return orderRepository.confirmOrderDelivery(orderId);
}

/**
 * Delete an order. Only Owner_Preparing is deletable.
 */
async function remove(orderId) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.status !== "Owner_Preparing") {
    throw new BadRequestError("Only Owner_Preparing can be deleted");
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

async function listForMobile({ user } = {}) {
  const role = user?.role;
  const rows = await list();

  if (role === "Delivery") {
    const agentId =
      user.deliveryAgentId != null && String(user.deliveryAgentId).trim() !== ""
        ? String(user.deliveryAgentId)
        : "";
    if (!agentId) return [];
    return rows.filter((row) => String(row.deliveryAgentId || "") === agentId);
  }

  if (role === "Depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot) return [];
    // Restrict to customers in this depot.
    const customers = await customerRepository.listCustomersByDepotId(depot.id);
    const allowedCustomerIds = new Set(customers.map((c) => String(c.id)));
    return rows.filter((row) => allowedCustomerIds.has(String(row.customerId)));
  }

  return rows;
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
  createOrderGroup,
  updateOrderGroup,
  deleteOrderGroup,
  listStatuses,
  getDashboardSummary,
  listForMobile,
  // mutations
  create,
  createBatch,
  createDepotBatch,
  assign,
  updateStatus,
  confirmDelivery,
  remove,
  updateStatusForMobile,
};
