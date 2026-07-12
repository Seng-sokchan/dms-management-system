const crypto = require("node:crypto");
const { ORDER_TYPE_CUSTOMER, ORDER_TYPE_DEPOT } = require("../constants/orderTypes");
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
const {
  normalizePaymentCurrency,
  resolveOrderPaymentAmount,
  resolveOrdersPaymentAmount,
  resolveOrdersPaymentAmounts,
  PAYMENT_CURRENCIES,
} = require("./paymentAmountResolver");
const { buildCheckoutPageHtml } = require("../integrations/payway/buildCheckoutPageHtml");
const {
  parsePurchaseResponse,
  assertPurchaseSuccess,
  extractHostedCheckoutUrl,
  buildHostedCheckoutRedirectHtml,
} = require("../integrations/payway/paywayResponse");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../errors");
const {
  hasDataScope,
  getDepotForUser,
} = require("./accessScopeService");
const { CHECKOUT_TTL_MS } = require("../config/paymentConfig");

function generatePaywayTranId() {
  return crypto.randomBytes(10).toString("hex");
}

function buildReturnDeeplink(paymentId) {
  return buildPaymentReturnUrl(paymentId);
}

function assertSessionActive(session) {
  if (paymentStatusCache.isSessionExpired(session)) {
    throw new BadRequestError("Payment session expired");
  }
}

function mapCheckoutResponse(session, extra = {}) {
  const status = session.status === "expired" ? "expired" : "unpaid";
  return {
    paymentId: session.id,
    orderId: Number(session.orderId),
    status,
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
      : (row) => mapCheckoutResponse(
        paymentOrSession.status === "expired" ? { ...row, status: "expired" } : row,
        extra,
      );
  const mapped = mapper(paymentOrSession);
  if (orderDetailIds.length > 0) {
    mapped.orderIds = orderDetailIds.map((id) => Number(id));
    if (orderDetailIds.length > 1) {
      mapped.masterOrderId = Number(masterOrderId);
    }
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

async function buildPaywayCheckoutFormForSession(session, {
  user,
  paymentOption = paywayClient.DEFAULT_PAYMENT_OPTION,
} = {}) {
  const baseParams = {
    tranId: session.paywayTranId,
    amount: session.amount,
    currency: session.currency,
    paymentOption,
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
    orderIds: orderIds || null,
  };
  return paymentStatusCache.saveCheckoutSession(session);
}

async function createPaymentIntent({ orderId, currency, idempotencyKey }, { user }) {
  assertPaywayConfigured();

  const order = await orderRepository.getOrderById(orderId);
  await assertCanPayOrder(order, user);
  const masterOrderId = await resolveMasterOrderId(orderId);
  if (!masterOrderId) throw new NotFoundError("Order not found");

  if (order.paymentStatus === "paid") {
    throw new BadRequestError("Order is already paid");
  }

  const paymentCurrency = normalizePaymentCurrency(currency || order.currency);
  const paymentAmount = await resolveOrderPaymentAmount(order, paymentCurrency);

  const existing = await paymentStatusCache.findCheckoutByMasterOrderId(masterOrderId);
  if (existing) {
    if (paymentStatusCache.isSessionExpired(existing)) {
      await paymentStatusCache.removeCheckoutSession(existing.id);
    } else if (normalizePaymentCurrency(existing.currency) === paymentCurrency) {
      return enrichCheckoutResponse(existing, {}, { user });
    } else {
      await paymentStatusCache.removeCheckoutSession(existing.id);
    }
  }

  const paymentId = crypto.randomUUID();
  const paywayTranId = generatePaywayTranId();
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);
  const returnParams = buildCheckoutReturnParams({ paymentId, orderId: String(orderId) });

  const session = await saveCheckoutSession({
    paymentId,
    masterOrderId,
    customerId: order.customerId,
    paywayTranId,
    amount: paymentAmount,
    currency: paymentCurrency,
    returnParams,
    expiresAt,
    idempotencyKey: idempotencyKey || `checkout-${orderId}-${Date.now()}`,
  });

  return enrichCheckoutResponse(session, {}, { user });
}

async function createBatchPaymentIntent({ masterOrderId, currency, idempotencyKey }, { user }) {
  assertPaywayConfigured();

  if (
    !hasDataScope(user, "depot")
    && !hasDataScope(user, "customer")
    && !hasDataScope(user, "all")
    && !hasDataScope(user, "owner")
  ) {
    throw new ForbiddenError("Batch payment is not available for this account");
  }

  const depot = hasDataScope(user, "depot") ? await getDepotForUser(user) : null;
  if (hasDataScope(user, "depot") && !depot) {
    throw new ForbiddenError("Depot profile not found");
  }

  const master = await orderRepository.getMasterOrderById(masterOrderId);
  if (!master) {
    throw new NotFoundError("Master order not found");
  }

  let orders = await orderRepository.listOrdersByMasterOrderId(masterOrderId);
  if (!orders.length) {
    throw new NotFoundError("No orders found for this master order");
  }

  if (hasDataScope(user, "customer")) {
    if (master.targetType !== ORDER_TYPE_CUSTOMER) {
      throw new BadRequestError("This order must be paid individually");
    }
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    if (!customer) throw new ForbiddenError("Customer profile not found");
    orders = orders.filter((order) => String(order.customerId) === String(customer.id));
    if (!orders.length) {
      throw new NotFoundError("No orders found for this master order");
    }
  }

  if (hasDataScope(user, "depot") && master.targetType !== ORDER_TYPE_DEPOT) {
    throw new BadRequestError("This is not a depot batch order");
  }

  for (const order of orders) {
    await assertCanPayOrder(order, user);
  }

  if (orders.some((order) => order.paymentStatus === "paid")) {
    throw new BadRequestError("Some orders in this batch are already paid");
  }

  const resolvedMasterOrderId = Number(masterOrderId);
  const existingPending = await paymentStatusCache.findCheckoutByMasterOrderId(resolvedMasterOrderId);
  const paymentCurrency = normalizePaymentCurrency(currency || orders[0]?.currency);
  const totalAmount = await resolveOrdersPaymentAmount(orders, paymentCurrency);

  if (existingPending) {
    if (paymentStatusCache.isSessionExpired(existingPending)) {
      await paymentStatusCache.removeCheckoutSession(existingPending.id);
    } else if (normalizePaymentCurrency(existingPending.currency) === paymentCurrency) {
      return enrichCheckoutResponse(existingPending, {
        masterOrderId: resolvedMasterOrderId,
        orderIds: orders.map((order) => Number(order.id)),
      }, { user });
    } else {
      await paymentStatusCache.removeCheckoutSession(existingPending.id);
    }
  }

  if (orders.some((order) => (order.paymentStatus || "unpaid") !== "unpaid")) {
    throw new BadRequestError("All orders in the batch must be unpaid");
  }

  const firstOrder = orders[0];
  const orderIds = orders.map((order) => order.id);

  const paymentId = crypto.randomUUID();
  const paywayTranId = generatePaywayTranId();
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);
  const returnParams = buildCheckoutReturnParams({
    paymentId,
    masterOrderId: resolvedMasterOrderId,
    orderIds: orderIds.map(String),
  });

  const session = await saveCheckoutSession({
    paymentId,
    masterOrderId: resolvedMasterOrderId,
    customerId: firstOrder.customerId,
    paywayTranId,
    amount: totalAmount,
    currency: paymentCurrency,
    returnParams,
    expiresAt,
    idempotencyKey: idempotencyKey || `batch-${resolvedMasterOrderId}-${Date.now()}`,
    orderIds: orderIds.map(String),
  });

  return enrichCheckoutResponse(session, {
    masterOrderId: resolvedMasterOrderId,
    orderIds: orderIds.map((id) => Number(id)),
  }, { user });
}

async function mapExpiredSessionResponse(session, extra, { user } = {}) {
  const mapped = await enrichCheckoutResponse(session, extra, { user });
  mapped.status = "expired";
  mapped.liveCheckActive = false;
  return mapped;
}

async function getPaymentById(paymentId, { user }) {
  const cached = await paymentStatusCache.getStatus(paymentId);
  if (cached?.status === "expired") {
    const expiredSession = await paymentStatusCache.getCheckoutSession(paymentId);
    if (expiredSession) {
      const order = await orderRepository.getOrderById(
        (await orderRepository.listOrderDetailIdsByMasterOrderId(expiredSession.orderId))[0]
          || expiredSession.orderId,
      );
      if (order) await assertCanPayOrder(order, user);
      return mapExpiredSessionResponse(expiredSession, {}, { user });
    }
  }
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

  if (paymentStatusCache.isSessionExpired(session)) {
    await paymentStatusCache.expireCheckoutSession(paymentId);
    return mapExpiredSessionResponse(session, {}, { user });
  }

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
  if (session) {
    if (paymentStatusCache.isSessionExpired(session)) {
      await paymentStatusCache.expireCheckoutSession(session.id);
    } else if (await paymentStatusCache.isLiveCheckActive(session.id)) {
      return {
        orderId: Number(orderId),
        paymentStatus: "unpaid",
        payment: await enrichCheckoutResponse(session, {}, { user }),
      };
    }
  }

  return {
    orderId: Number(orderId),
    paymentStatus: order?.paymentStatus || "unpaid",
    payment: null,
  };
}

async function loadActiveCheckoutSession(paymentId, { user }) {
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

  assertSessionActive(session);
  return session;
}

function mapPurchaseForClient(response) {
  assertPurchaseSuccess(response);
  const parsed = parsePurchaseResponse(response);
  if (!parsed.qrString && !parsed.qrImageUrl && !parsed.checkoutQrUrl && !parsed.deeplinkUrl) {
    throw new BadRequestError("PayWay did not return KHQR data");
  }
  return {
    qrString: parsed.qrString,
    qrImageUrl: parsed.qrImageUrl,
    checkoutQrUrl: parsed.checkoutQrUrl,
    deeplinkUrl: parsed.deeplinkUrl,
    playStoreUrl: parsed.playStoreUrl,
    appStoreUrl: parsed.appStoreUrl,
  };
}

async function submitPaywayPurchase(paymentId, { user }) {
  const session = await loadActiveCheckoutSession(paymentId, { user });
  await paymentStatusCache.startLiveCheck(session);
  const paywayCheckout = await buildPaywayCheckoutFormForSession(session, {
    user,
    paymentOption: paywayClient.DEFAULT_PAYMENT_OPTION || "abapay_khqr_deeplink",
  });
  const response = await paywayClient.submitCheckoutForm(paywayCheckout);
  return mapPurchaseForClient(response);
}

async function getCheckoutPage(paymentId, { user }) {
  const session = await loadActiveCheckoutSession(paymentId, { user });
  await paymentStatusCache.startLiveCheck(session);

  const paywayCheckout = await buildPaywayCheckoutFormForSession(session, {
    user,
    paymentOption: paywayClient.DEFAULT_PAYMENT_OPTION || "abapay_khqr_deeplink",
  });
  try {
    const response = await paywayClient.submitCheckoutForm(paywayCheckout);
    const hostedUrl = extractHostedCheckoutUrl(response, paywayCheckout.action);
    const redirectHtml = buildHostedCheckoutRedirectHtml(hostedUrl);
    if (redirectHtml) return redirectHtml;
  } catch {
    // Fall back to legacy checkout2-0.js embed when hosted redirect is unavailable.
  }

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

  assertSessionActive(session);

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

async function getPaymentAmountOptions({ orderIds }, { user }) {
  const orders = (
    await Promise.all(orderIds.map((id) => orderRepository.getOrderById(id)))
  ).filter(Boolean);

  if (orders.length !== orderIds.length) {
    throw new NotFoundError("One or more orders were not found");
  }

  for (const order of orders) {
    await assertCanPayOrder(order, user);
  }

  const amounts = await resolveOrdersPaymentAmounts(orders);
  const defaultCurrency = normalizePaymentCurrency(orders[0]?.currency);

  return {
    amounts,
    availableCurrencies: PAYMENT_CURRENCIES,
    defaultCurrency,
  };
}

module.exports = {
  createPaymentIntent,
  createBatchPaymentIntent,
  getPaymentAmountOptions,
  getPaymentById,
  getLatestPaymentForOrder,
  getCheckoutPage,
  submitPaywayPurchase,
  startPaymentLiveCheck,
  stopPaymentLiveCheck,
  cancelPayment,
  mapPaymentResponse,
  resolveMasterOrderId,
};
