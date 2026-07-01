const crypto = require("node:crypto");
const paymentRepository = require("../repositories/payments");
const orderRepository = require("../repositories/orders");
const customerRepository = require("../repositories/customers");
const depotRepository = require("../repositories/depots");
const paywayClient = require("../integrations/payway/paywayClient");
const { assertPaywayConfigured, formatAmountForPayway } = require("../integrations/payway/paywayConfig");
const {
  buildPaymentReturnUrl,
  formatReturnDeeplinkForPayway,
} = require("../integrations/payway/paywayReturnDeeplink");
const paywayWebhookService = require("./paywayWebhookService");
const paymentStatusCache = require("./paymentStatusCache");
const { buildCheckoutPageHtml } = require("../integrations/payway/buildCheckoutPageHtml");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../errors");
const {
  hasDataScope,
  getDepotForUser,
} = require("./accessScopeService");

const CHECKOUT_TTL_MINUTES = 5;

function generatePaywayTranId() {
  return crypto.randomBytes(10).toString("hex");
}

function buildReturnDeeplink(paymentId) {
  return buildPaymentReturnUrl(paymentId);
}

function mapCheckoutResponse(session, extra = {}) {
  return {
    paymentId: session.id,
    orderId: Number(session.orderId),
    status: "unpaid",
    amount: session.amount,
    currency: session.currency,
    returnDeeplink: buildReturnDeeplink(session.id),
    expiresAt: session.expiresAt,
    paidAt: null,
    paywayCheckout: session.paywayCheckout || null,
    ...extra,
  };
}

function mapPaymentResponse(payment, extra = {}) {
  return {
    paymentId: payment.id,
    orderId: Number(payment.orderId),
    status: payment.status || "paid",
    amount: payment.amount,
    currency: payment.currency,
    returnDeeplink: buildReturnDeeplink(payment.id),
    expiresAt: null,
    paidAt: payment.paidAt,
    ...extra,
  };
}

async function mapPaymentResponseWithOrders(paymentOrSession, extra = {}) {
  const masterOrderId = paymentOrSession.orderId;
  const orderDetailIds = await orderRepository.listOrderDetailIdsByMasterOrderId(masterOrderId);
  const mapper =
    paymentOrSession.status === "paid"
      ? (row) => mapPaymentResponse(row, extra)
      : (row) => mapCheckoutResponse(row, extra);
  const mapped = mapper(paymentOrSession);
  if (orderDetailIds.length > 0) {
    mapped.orderIds = orderDetailIds.map((id) => Number(id));
  }
  return mapped;
}

async function resolveMasterOrderId(orderOrDetailId, executor) {
  const order = await orderRepository.getOrderById(orderOrDetailId, executor);
  if (!order) return null;
  if (order.masterOrderId) return Number(order.masterOrderId);
  return orderRepository.getMasterOrderIdForDetailId(orderOrDetailId, executor);
}

async function assertCanPayOrder(order, user) {
  if (!order) throw new NotFoundError("Order not found");

  if (hasDataScope(user, "customer")) {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    if (!customer) throw new ForbiddenError("Customer profile not found");
    if (String(order.customerId) !== String(customer.id)) {
      throw new ForbiddenError("You cannot pay for this order");
    }
    return customer;
  }

  if (hasDataScope(user, "depot")) {
    const depot = await getDepotForUser(user);
    if (!depot) throw new ForbiddenError("Depot profile not found");
    const orderCustomer = await customerRepository.getCustomerById(order.customerId);
    if (!orderCustomer || String(orderCustomer.depotId) !== String(depot.id)) {
      throw new ForbiddenError("Order does not belong to your depot");
    }
    return orderCustomer;
  }

  if (hasDataScope(user, "all") || hasDataScope(user, "owner")) {
    const orderCustomer = await customerRepository.getCustomerById(order.customerId);
    return orderCustomer || null;
  }

  throw new ForbiddenError("Unauthorized to create payment");
}

function paywayBuyerFromDepot(depot, fallbackName = "Depot") {
  const fullName = String(depot?.name || fallbackName).trim() || fallbackName;
  const parts = fullName.split(/\s+/);
  return {
    firstName: parts[0] || fallbackName,
    lastName: parts.slice(1).join(" ") || "Operator",
    phone: depot?.phone || "0000000000",
    email: "depot@example.com",
  };
}

function paywayBuyerFromCustomer(customer, fallbackName = "Customer") {
  const fullName = String(customer?.name || fallbackName).trim() || fallbackName;
  const parts = fullName.split(/\s+/);
  return {
    firstName: parts[0] || fallbackName,
    lastName: parts.slice(1).join(" ") || "User",
    phone: customer?.phone || "0000000000",
    email: "customer@example.com",
  };
}

function buildCheckoutReturnParams(base) {
  return JSON.stringify({ ...base, mode: "checkout" });
}

function parseCheckoutReturnParams(returnParams) {
  try {
    return returnParams ? JSON.parse(returnParams) : {};
  } catch {
    return {};
  }
}

async function buildPaywayCheckoutFormForSession(session, { user } = {}) {
  const baseParams = {
    tranId: session.paywayTranId,
    amount: session.amount,
    currency: session.currency,
    paymentOption: "checkout",
    returnDeeplink: formatReturnDeeplinkForPayway(session.id),
    returnParams: session.returnParams,
  };

  const parsedReturn = parseCheckoutReturnParams(session.returnParams);
  const orderIds = Array.isArray(parsedReturn.orderIds) && parsedReturn.orderIds.length
    ? parsedReturn.orderIds.map((id) => Number(id))
    : session.orderIds?.map((id) => Number(id)) || null;

  if (orderIds?.length) {
    const orders = (
      await Promise.all(orderIds.map((id) => orderRepository.getOrderById(id)))
    ).filter(Boolean);
    let buyer = paywayBuyerFromCustomer(
      orders[0]?.customerId ? await customerRepository.getCustomerById(orders[0].customerId) : null,
      orders[0]?.customerName || "Customer",
    );
    if (user?.role === "Depot") {
      const depot = await depotRepository.getDepotByDepotUserId(user.sub);
      if (depot) buyer = paywayBuyerFromDepot(depot);
    }
    const paywayItems = orders.map((order) => ({
      name: order.itemName ? `Order #${order.id} - ${order.itemName}` : `Order #${order.id}`,
      quantity: 1,
      price: formatAmountForPayway(order.amountTotal, session.currency),
    }));
    return paywayClient.buildPaywayCheckoutForm({
      ...baseParams,
      customer: buyer,
      items: paywayItems,
    });
  }

  const orderDetailId =
    (await orderRepository.listOrderDetailIdsByMasterOrderId(session.orderId))[0]
    || session.orderId;
  const order = await orderRepository.getOrderById(orderDetailId);
  const customer = order?.customerId
    ? await customerRepository.getCustomerById(order.customerId)
    : null;
  const buyer = paywayBuyerFromCustomer(customer, order?.customerName || "Customer");
  const itemLabel = order?.itemName
    ? `Order #${orderDetailId} - ${order.itemName}`
    : `Order #${orderDetailId}`;

  return paywayClient.buildPaywayCheckoutForm({
    ...baseParams,
    customer: buyer,
    itemLabel,
  });
}

async function enrichCheckoutResponse(session, extra = {}, { user } = {}) {
  const mapped = await mapPaymentResponseWithOrders(session, extra);
  mapped.liveCheckActive = await paymentStatusCache.isLiveCheckActive(session.id);
  if (mapped.paywayCheckout) return mapped;
  mapped.paywayCheckout = await buildPaywayCheckoutFormForSession(session, { user });
  return mapped;
}

async function saveCheckoutSession({
  paymentId,
  masterOrderId,
  customerId,
  paywayTranId,
  amount,
  currency,
  returnParams,
  expiresAt,
  idempotencyKey,
  batchId,
  orderIds,
}) {
  const session = {
    id: paymentId,
    orderId: String(masterOrderId),
    customerId: String(customerId),
    paywayTranId,
    amount,
    currency,
    returnParams,
    expiresAt: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    idempotencyKey,
    batchId: batchId ? String(batchId) : null,
    orderIds: orderIds || null,
  };
  return paymentStatusCache.saveCheckoutSession(session);
}

async function createPaymentIntent({ orderId, idempotencyKey }, { user }) {
  assertPaywayConfigured();

  const order = await orderRepository.getOrderById(orderId);
  await assertCanPayOrder(order, user);
  const masterOrderId = await resolveMasterOrderId(orderId);
  if (!masterOrderId) throw new NotFoundError("Order not found");

  if (order.paymentStatus === "paid") {
    throw new BadRequestError("Order is already paid");
  }

  const existing = await paymentStatusCache.findCheckoutByMasterOrderId(masterOrderId);
  if (existing) {
    return enrichCheckoutResponse(existing, {}, { user });
  }

  const paymentId = crypto.randomUUID();
  const paywayTranId = generatePaywayTranId();
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
  const returnParams = buildCheckoutReturnParams({ paymentId, orderId: String(orderId) });

  const session = await saveCheckoutSession({
    paymentId,
    masterOrderId,
    customerId: order.customerId,
    paywayTranId,
    amount: order.amountTotal,
    currency: order.currency,
    returnParams,
    expiresAt,
    idempotencyKey: idempotencyKey || `checkout-${orderId}-${Date.now()}`,
  });

  return enrichCheckoutResponse(session, {}, { user });
}

async function createBatchPaymentIntent({ batchId, idempotencyKey }, { user }) {
  assertPaywayConfigured();

  if (!hasDataScope(user, "depot") && !hasDataScope(user, "all") && !hasDataScope(user, "owner")) {
    throw new ForbiddenError("Batch payment is only available for Depot users");
  }

  const depot = hasDataScope(user, "depot") ? await getDepotForUser(user) : null;
  if (hasDataScope(user, "depot") && !depot) {
    throw new ForbiddenError("Depot profile not found");
  }

  let orders = await orderRepository.listOrdersByDepotBatchId(batchId);
  if (!orders.length) {
    throw new NotFoundError("No orders found for this batch");
  }

  for (const order of orders) {
    await assertCanPayOrder(order, user);
  }

  if (orders.some((order) => order.paymentStatus === "paid")) {
    throw new BadRequestError("Some orders in this batch are already paid");
  }

  const existingPending = await paymentStatusCache.findCheckoutByBatchId(batchId);
  if (existingPending) {
    return enrichCheckoutResponse(existingPending, {
      batchId,
      orderIds: orders.map((order) => Number(order.id)),
    }, { user });
  }

  if (orders.some((order) => (order.paymentStatus || "unpaid") !== "unpaid")) {
    throw new BadRequestError("All orders in the batch must be unpaid");
  }

  const currencies = new Set(orders.map((order) => String(order.currency || "KHR").toUpperCase()));
  if (currencies.size > 1) {
    throw new BadRequestError("All orders in a batch must use the same currency");
  }
  const currency = [...currencies][0];
  const totalAmount = orders.reduce((sum, order) => sum + Number(order.amountTotal || 0), 0);
  const firstOrder = orders[0];
  const masterOrderId = Number(firstOrder.masterOrderId);
  const orderIds = orders.map((order) => order.id);

  const paymentId = crypto.randomUUID();
  const paywayTranId = generatePaywayTranId();
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
  const returnParams = buildCheckoutReturnParams({
    paymentId,
    batchId,
    orderIds: orderIds.map(String),
  });

  const session = await saveCheckoutSession({
    paymentId,
    masterOrderId,
    customerId: firstOrder.customerId,
    paywayTranId,
    amount: totalAmount,
    currency,
    returnParams,
    expiresAt,
    idempotencyKey: idempotencyKey || `batch-${batchId}-${Date.now()}`,
    batchId,
    orderIds: orderIds.map(String),
  });

  return enrichCheckoutResponse(session, {
    batchId,
    orderIds: orderIds.map((id) => Number(id)),
  }, { user });
}

async function getPaymentById(paymentId, { user }) {
  const cached = await paymentStatusCache.getStatus(paymentId);
  if (cached?.status === "paid") {
    const paid = await paymentRepository.getPaymentById(paymentId);
    if (paid) {
      const order = await orderRepository.getOrderById(
        (await orderRepository.listOrderDetailIdsByMasterOrderId(paid.orderId))[0] || paid.orderId,
      );
      if (order) await assertCanPayOrder(order, user);
      return mapPaymentResponseWithOrders(paid);
    }
  }

  let paid = await paymentRepository.getPaymentById(paymentId);
  if (paid) {
    const order = await orderRepository.getOrderById(
      (await orderRepository.listOrderDetailIdsByMasterOrderId(paid.orderId))[0] || paid.orderId,
    );
    if (order) await assertCanPayOrder(order, user);
    return mapPaymentResponseWithOrders(paid);
  }

  let session = await paymentStatusCache.getCheckoutSession(paymentId);
  if (!session) throw new NotFoundError("Payment not found");

  const order = await orderRepository.getOrderById(
    (await orderRepository.listOrderDetailIdsByMasterOrderId(session.orderId))[0] || session.orderId,
  );
  if (order) await assertCanPayOrder(order, user);

  const liveCheckActive = await paymentStatusCache.isLiveCheckActive(paymentId);
  const shouldReconcile = liveCheckActive && (await paymentStatusCache.shouldReconcile(paymentId));
  if (shouldReconcile) {
    const reconciled = await paywayWebhookService.reconcileCheckoutSession(session);
    if (reconciled?.status === "paid") {
      await paymentStatusCache.setPaid(reconciled);
      emitPaymentStatus(reconciled);
      return mapPaymentResponseWithOrders(reconciled);
    }
    if (liveCheckActive) {
      await paymentStatusCache.touchLiveCheck(session);
    }
    session = (await paymentStatusCache.getCheckoutSession(paymentId)) || session;
  }

  const mapped = await enrichCheckoutResponse(session, {}, { user });
  if (!mapped.liveCheckActive && cached?.status) {
    mapped.status = cached.status;
  }
  return mapped;
}

async function getLatestPaymentForOrder(orderId, { user }) {
  const order = await orderRepository.getOrderById(orderId);
  await assertCanPayOrder(order, user);

  const masterOrderId = await resolveMasterOrderId(orderId);
  const paid = masterOrderId
    ? await paymentRepository.getLatestPaymentByMasterOrderId(masterOrderId)
    : null;
  if (paid) {
    return {
      orderId: Number(orderId),
      paymentStatus: "paid",
      payment: await mapPaymentResponseWithOrders(paid),
    };
  }

  const session = masterOrderId
    ? await paymentStatusCache.findCheckoutByMasterOrderId(masterOrderId)
    : null;
  if (session && (await paymentStatusCache.isLiveCheckActive(session.id))) {
    return {
      orderId: Number(orderId),
      paymentStatus: "unpaid",
      payment: await enrichCheckoutResponse(session, {}, { user }),
    };
  }

  return {
    orderId: Number(orderId),
    paymentStatus: order?.paymentStatus || "unpaid",
    payment: null,
  };
}

async function getCheckoutPage(paymentId, { user }) {
  const paid = await paymentRepository.getPaymentById(paymentId);
  if (paid) {
    throw new BadRequestError("Payment already completed");
  }

  const session = await paymentStatusCache.getCheckoutSession(paymentId);
  if (!session) throw new NotFoundError("Payment not found");

  const order = await orderRepository.getOrderById(
    (await orderRepository.listOrderDetailIdsByMasterOrderId(session.orderId))[0] || session.orderId,
  );
  if (order) await assertCanPayOrder(order, user);

  await paymentStatusCache.startLiveCheck(session);

  const paywayCheckout = await buildPaywayCheckoutFormForSession(session, { user });
  const html = buildCheckoutPageHtml(paywayCheckout);
  if (!html) {
    throw new BadRequestError("PayWay checkout is unavailable");
  }
  return html;
}

async function startPaymentLiveCheck(paymentId, { user }) {
  const session = await paymentStatusCache.getCheckoutSession(paymentId);
  if (!session) {
    const paid = await paymentRepository.getPaymentById(paymentId);
    if (paid) {
      return { paymentId, status: "paid", liveCheckActive: false };
    }
    throw new NotFoundError("Payment not found");
  }

  const order = await orderRepository.getOrderById(
    (await orderRepository.listOrderDetailIdsByMasterOrderId(session.orderId))[0] || session.orderId,
  );
  if (order) await assertCanPayOrder(order, user);

  await paymentStatusCache.startLiveCheck(session);
  return { paymentId, status: "unpaid", liveCheckActive: true };
}

async function stopPaymentLiveCheck(paymentId, { user }) {
  const session = await paymentStatusCache.getCheckoutSession(paymentId);
  if (!session) {
    const paid = await paymentRepository.getPaymentById(paymentId);
    if (paid) {
      return { paymentId, status: "paid", liveCheckActive: false };
    }
    throw new NotFoundError("Payment not found");
  }

  const order = await orderRepository.getOrderById(
    (await orderRepository.listOrderDetailIdsByMasterOrderId(session.orderId))[0] || session.orderId,
  );
  if (order) await assertCanPayOrder(order, user);

  await paymentStatusCache.stopLiveCheck(paymentId);
  return { paymentId, status: "unpaid", liveCheckActive: false };
}

async function cancelPayment(paymentId, { user }) {
  const session = await paymentStatusCache.getCheckoutSession(paymentId);
  if (!session) {
    const paid = await paymentRepository.getPaymentById(paymentId);
    if (paid) throw new BadRequestError("Paid payments cannot be cancelled");
    throw new NotFoundError("Payment not found");
  }

  const order = await orderRepository.getOrderById(
    (await orderRepository.listOrderDetailIdsByMasterOrderId(session.orderId))[0] || session.orderId,
  );
  await assertCanPayOrder(order, user);

  await paymentStatusCache.removeCheckoutSession(paymentId);
  return {
    paymentId,
    status: "unpaid",
    orderId: Number(session.orderId),
  };
}

module.exports = {
  createPaymentIntent,
  createBatchPaymentIntent,
  getPaymentById,
  getLatestPaymentForOrder,
  getCheckoutPage,
  startPaymentLiveCheck,
  stopPaymentLiveCheck,
  cancelPayment,
  mapPaymentResponse,
  resolveMasterOrderId,
};
