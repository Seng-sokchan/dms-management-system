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
const orderRepository = require("../repositories/orders");
const customerRepository = require("../repositories/customers");
const depotRepository = require("../repositories/depots");
const itemRepository = require("../repositories/items");
const customerItemPriceRepository = require("../repositories/customerItemPrices");
const deliveryAgentRepository = require("../repositories/deliveryAgents");
const producerRepository = require("../repositories/producers");
const { ORDER_TYPE_CUSTOMER, ORDER_TYPE_DEPOT } = require("../constants/orderTypes");
const lookupRepository = require("../repositories/lookups");
const overviewRepository = require("../repositories/overview");
const { getNextStatuses, getStatusNames: getCachedStatusNames, canUpdateAnyStatus } = require("./rulesCache");
const { assertCanSetStatus } = require("./accessPolicyService");
const { getPool } = require("../../database/pool");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../errors");
const telegramService = require("./telegramService");

/** New orders always use this producer; delivery agent is set later via assign. */
const DEFAULT_NEW_ORDER_PRODUCER_ID = "1";

/** Normal unpaid received orders that block placing another order (special-day deliveries are excluded). */
const UNPAID_RECEIVED_ORDER_LIMIT = 1;

const UNPAID_RECEIVED_ORDERS_MESSAGE =
  "Pay for your received unpaid order(s) before placing a new order.";

// ---------------------------------------------------------------------------
// Status helpers (pure)
// ---------------------------------------------------------------------------

function getNextAllowedStatuses(currentStatus, orderedStatuses) {
  const mapped = getNextStatuses(currentStatus);
  if (mapped.length > 0) return mapped;

  const names = Array.isArray(orderedStatuses) && orderedStatuses.length
    ? orderedStatuses
    : getCachedStatusNames();
  if (names.length > 1) {
    const currentIndex = names.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < names.length - 1) {
      return [names[currentIndex + 1]];
    }
    if (currentIndex === names.length - 1) {
      return [];
    }
  }
  return [];
}

async function getStatusNames() {
  const rows = await lookupRepository.listOrderStatuses();
  return rows.map((row) => row.name);
}

async function hydrateFactoryNotificationLabels(order) {
  if (!order) return order;

  const [deliveryAgent] = await Promise.all([
    order.deliveryAgentName || !order.deliveryAgentId
      ? null
      : deliveryAgentRepository.getDeliveryAgentById(order.deliveryAgentId),
  ]);

  return {
    ...order,
    deliveryAgentName: order.deliveryAgentName || deliveryAgent?.name || null,
  };
}

async function getFactoryNotificationOrders(order) {
  const orders = await orderRepository.listFactoryNotificationOrdersByOrderId(order.id);
  const listedOrder = orders.find((row) => String(row.id) === String(order.id));
  const sourceOrder = await hydrateFactoryNotificationLabels(listedOrder || order);

  if (!sourceOrder?.deliveryAgentId) {
    return [sourceOrder || order];
  }

  const deliveryAgentId = String(sourceOrder.deliveryAgentId);
  const currentStatus = sourceOrder.status;

  const matchingOrders = orders.filter(
    (row) =>
      row.status === currentStatus &&
      String(row.deliveryAgentId || "") === deliveryAgentId,
  );

  const notificationOrders = matchingOrders.length > 0 ? matchingOrders : [sourceOrder];
  return notificationOrders.map((row) => ({
    ...row,
    deliveryAgentName: row.deliveryAgentName || sourceOrder.deliveryAgentName,
  }));
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

async function listStatuses() {
  return lookupRepository.listOrderStatuses();
}

async function getDashboardSummary() {
  return overviewRepository.getDashboardSummary();
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

async function assertCustomerCanPlaceNewOrder(customerId, executor) {
  const n = await orderRepository.countUnpaidReceivedOrdersByCustomer(customerId, executor);
  if (n >= UNPAID_RECEIVED_ORDER_LIMIT) {
    throw new BadRequestError(UNPAID_RECEIVED_ORDERS_MESSAGE);
  }
}

/**
 * Create an order. Validates referenced entities exist and resolves the
 * unit price from customer-item mapping when not provided.
 */
async function create(payload) {
  const customer = await customerRepository.getCustomerById(payload.customerId);
  if (!customer) throw new BadRequestError("Customer not found");

  await assertCustomerCanPlaceNewOrder(payload.customerId);

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
 * or the customer is at/above the unpaid-received order limit at commit time.
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
    await assertCustomerCanPlaceNewOrder(customerId, conn);

    const master = await orderRepository.createMasterOrder(ORDER_TYPE_CUSTOMER, conn);
    const orders = [];
    for (const row of rowsToInsert) {
      orders.push(await orderRepository.createOrder({ ...row, masterOrderId: master.id }, conn));
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
 * any customer. Each customer must still satisfy `assertCustomerCanPlaceNewOrder`.
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
      await assertCustomerCanPlaceNewOrder(customerId, conn);
    }

    const master = await orderRepository.createMasterOrder(ORDER_TYPE_DEPOT, conn);
    const orders = [];
    for (const row of rowsToInsert) {
      orders.push(
        await orderRepository.createOrder({ ...row, masterOrderId: master.id }, conn),
      );
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
 * Assign an order to a producer or delivery agent. Validates targets exist.
 */
async function assign(orderId, payload) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (payload.deliveryAgentId) {
    const agent = await deliveryAgentRepository.getDeliveryAgentById(payload.deliveryAgentId);
    if (!agent) throw new BadRequestError("Delivery agent not found");
  }

  return orderRepository.updateOrderAssignment(orderId, payload);
}

/**
 * Move an order to the given status. Validates the status exists.
 */
async function updateStatus(orderId, nextStatus, { user, allowReverse = false } = {}) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (!canUpdateAnyStatus(user?.role)) {
    throw new ForbiddenError("Forbidden for this role");
  }

  const { getDataScope } = require("./rulesCache");
  if (getDataScope(user?.role) === "delivery_agent") {
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

  assertCanSetStatus(user?.role, nextStatus, "update_status");

  if (nextStatus === "Sent_To_Factory") {
    const notificationOrders = await getFactoryNotificationOrders(order);
    await telegramService.notifyOrderSentToFactory(notificationOrders, user);
    const updatedOrders = await orderRepository.updateOrderStatuses(
      notificationOrders.map((row) => row.id),
      nextStatus,
    );
    return updatedOrders.find((row) => String(row.id) === String(orderId)) || updatedOrders[0] || null;
  }

  return orderRepository.updateOrderStatus(orderId, nextStatus);
}

/**
 * Confirm a delivery with loss quantity; sets Recieve_By_Customer and delivered/loss qty.
 */
async function confirmDelivery(orderId, { lossQty }, { user } = {}) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  assertCanSetStatus(user?.role, "Recieve_By_Customer", "confirm_delivery");

  if (order.status !== "Ready_For_Delivery") {
    throw new BadRequestError("Order must be Ready_For_Delivery to confirm delivery");
  }

  const { getDataScope } = require("./rulesCache");
  if (getDataScope(user?.role) === "delivery_agent") {
    const agentId =
      user.deliveryAgentId != null && String(user.deliveryAgentId).trim() !== ""
        ? String(user.deliveryAgentId)
        : "";
    if (!agentId) {
      throw new ForbiddenError("Delivery account is not linked to a delivery agent");
    }
    if (String(order.deliveryAgentId || "") !== agentId) {
      throw new ForbiddenError("Forbidden for this order");
    }
  }

  const orderedQty = Number(order.orderedQty || 0);
  const loss = Number(lossQty);
  if (!Number.isFinite(loss) || loss < 0) {
    throw new BadRequestError("Invalid loss quantity");
  }
  if (loss > orderedQty) {
    throw new BadRequestError("Loss quantity cannot exceed ordered quantity");
  }

  const deliveredQty = orderedQty - loss;
  const updated = await orderRepository.confirmOrderDelivery(orderId, {
    deliveredQty,
    lossQty: loss,
  });
  await telegramService.notifyOrderDelivered(updated || order, {
    deliveredQty,
    lossQty: loss,
  });
  return updated;
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

  if (role === "Customer") {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    if (!customer) return [];
    return rows.filter((row) => String(row.customerId) === String(customer.id));
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
