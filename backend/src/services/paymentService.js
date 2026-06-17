const crypto = require("node:crypto");
const paymentRepository = require("../repositories/payments");
const paymentIntentRepository = require("../repositories/paymentIntents");
const orderRepository = require("../repositories/orders");
const customerRepository = require("../repositories/customers");
const depotRepository = require("../repositories/depots");
const paywayClient = require("../integrations/payway/paywayClient");
const { parsePurchaseResponse, assertPurchaseSuccess } = require("../integrations/payway/paywayResponse");
const { assertPaywayConfigured, formatAmountForPayway } = require("../integrations/payway/paywayConfig");
const {
  buildPaymentReturnUrl,
  formatReturnDeeplinkForPayway,
} = require("../integrations/payway/paywayReturnDeeplink");
const paywayWebhookService = require("./paywayWebhookService");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../errors");

const INTENT_TTL_MINUTES = 5;

function generatePaywayTranId() {
  return crypto.randomBytes(10).toString("hex");
}

function buildReturnDeeplink(paymentId) {
  return buildPaymentReturnUrl(paymentId);
}

function mapIntentResponse(intent, extra = {}) {
  return {
    paymentId: intent.id,
    orderId: Number(intent.orderId),
    status: "pending",
    amount: intent.amount,
    currency: intent.currency,
    checkoutUrl: intent.checkoutUrl,
    deeplinkUrl: intent.deeplinkUrl,
    qrString: intent.qrString || null,
    qrImageUrl: intent.checkoutUrl || null,
    returnDeeplink: buildReturnDeeplink(intent.id),
    expiresAt: intent.expiresAt,
    paidAt: null,
    playStoreUrl: null,
    appStoreUrl: null,
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
    checkoutUrl: null,
    deeplinkUrl: null,
    returnDeeplink: buildReturnDeeplink(payment.id),
    expiresAt: null,
    paidAt: payment.paidAt,
    playStoreUrl: null,
    appStoreUrl: null,
    ...extra,
  };
}

async function mapPaymentResponseWithOrders(paymentOrIntent, extra = {}) {
  const masterOrderId = paymentOrIntent.orderId;
  const orderDetailIds = await orderRepository.listOrderDetailIdsByMasterOrderId(masterOrderId);
  const mapper =
    paymentOrIntent.status === "pending"
      ? (row) => mapIntentResponse(row, extra)
      : (row) => mapPaymentResponse(row, extra);
  const mapped = mapper(paymentOrIntent);
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

  if (user.role === "Customer") {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    if (!customer) throw new ForbiddenError("Customer profile not found");
    if (String(order.customerId) !== String(customer.id)) {
      throw new ForbiddenError("You cannot pay for this order");
    }
    return customer;
  }

  if (user.role === "Depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot) throw new ForbiddenError("Depot profile not found");
    const orderCustomer = await customerRepository.getCustomerById(order.customerId);
    if (!orderCustomer || String(orderCustomer.depotId) !== String(depot.id)) {
      throw new ForbiddenError("Order does not belong to your depot");
    }
    return orderCustomer;
  }

  if (["Admin", "Owner"].includes(user.role)) {
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

async function resolveReusablePendingIntent(existing, paymentOption) {
  if (!existing) return null;
  const wantsKhqr = paymentIntentRepository.isKhqrOption(paymentOption);
  const isKhqrIntent = existing.channel === "khqr" || Boolean(existing.qrString);
  if (wantsKhqr === isKhqrIntent) {
    return existing;
  }
  await paymentIntentRepository.deleteIntentById(existing.id);
  return null;
}

async function insertIntentRow({
  paymentId,
  masterOrderId,
  customerId,
  paywayTranId,
  amount,
  currency,
  paymentOption,
  checkoutUrl,
  deeplinkUrl,
  qrString,
  paywayResponse,
  returnParams,
  expiresAt,
  idempotencyKey,
  executor,
}) {
  const base = {
    id: paymentId,
    orderId: masterOrderId,
    customerId,
    paywayTranId,
    amount,
    currency,
    rawCreateResponse: paywayResponse,
    returnParams,
    expiresAt,
    idempotencyKey,
  };
  if (paymentIntentRepository.isKhqrOption(paymentOption)) {
    return paymentIntentRepository.insertKhqrIntent(
      {
        ...base,
        qrString,
        qrImageUrl: checkoutUrl,
      },
      executor,
    );
  }
  return paymentIntentRepository.insertAbaIntent(
    {
      ...base,
      checkoutUrl,
      deeplinkUrl,
    },
    executor,
  );
}

async function createPaymentIntent({ orderId, paymentOption, idempotencyKey }, { user }) {
  assertPaywayConfigured();

  const order = await orderRepository.getOrderById(orderId);
  const orderCustomer = await assertCanPayOrder(order, user);
  const masterOrderId = await resolveMasterOrderId(orderId);
  if (!masterOrderId) throw new NotFoundError("Order not found");

  if (order.paymentStatus === "paid") {
    throw new BadRequestError("Order is already paid");
  }

  const existing = await paymentIntentRepository.findPendingIntentByMasterOrderId(masterOrderId);
  const reusable = await resolveReusablePendingIntent(existing, paymentOption);
  if (reusable) {
    return mapIntentResponse(reusable);
  }

  const paymentId = crypto.randomUUID();
  const paywayTranId = generatePaywayTranId();
  const expiresAt = new Date(Date.now() + INTENT_TTL_MINUTES * 60 * 1000);
  const returnParams = JSON.stringify({ paymentId, orderId: String(orderId) });
  const returnDeeplink = formatReturnDeeplinkForPayway(paymentId);

  const paywayResponse = await paywayClient.createPurchase({
    tranId: paywayTranId,
    amount: order.amountTotal,
    currency: order.currency,
    paymentOption: paymentOption || "abapay_deeplink",
    returnDeeplink,
    returnParams,
    customer: paywayBuyerFromCustomer(orderCustomer, order.customerName || "Customer"),
    itemLabel: order.itemName ? `Order #${order.id} - ${order.itemName}` : `Order #${order.id}`,
  });

  assertPurchaseSuccess(paywayResponse);
  const parsed = parsePurchaseResponse(paywayResponse);
  const { checkoutUrl, deeplinkUrl, qrString, playStoreUrl, appStoreUrl } = parsed;
  const option = String(paymentOption || "abapay_deeplink").toLowerCase();
  const isKhqr = option.includes("khqr");

  if (isKhqr) {
    if (!qrString && !checkoutUrl) {
      throw new BadRequestError(
        "PayWay did not return KHQR data. Check merchant settings and payment_option (abapay_khqr).",
      );
    }
  } else if (!deeplinkUrl && !checkoutUrl) {
    throw new BadRequestError(
      "PayWay did not return a payment link. Check merchant sandbox settings and payment_option.",
    );
  }

  const intent = await insertIntentRow({
    paymentId,
    masterOrderId,
    customerId: order.customerId,
    paywayTranId,
    amount: order.amountTotal,
    currency: order.currency,
    paymentOption,
    checkoutUrl,
    deeplinkUrl,
    qrString,
    paywayResponse,
    returnParams,
    expiresAt,
    idempotencyKey: idempotencyKey || `intent-${orderId}-${Date.now()}`,
  });

  return {
    ...mapIntentResponse(intent),
    playStoreUrl,
    appStoreUrl,
    qrString: qrString || null,
    qrImageUrl: checkoutUrl || null,
  };
}

async function buildBatchIntentResponse(intent, batchId, orders, paywayExtras = {}) {
  const orderIds = orders?.length
    ? orders.map((order) => Number(order.id))
    : (await orderRepository.listOrderDetailIdsByMasterOrderId(intent.orderId)).map(
        (id) => Number(id),
      );
  const mapped = mapIntentResponse(intent, { batchId, orderIds });
  return {
    ...mapped,
    playStoreUrl: paywayExtras.playStoreUrl || null,
    appStoreUrl: paywayExtras.appStoreUrl || null,
    qrString: paywayExtras.qrString ?? mapped.qrString ?? null,
    qrImageUrl: paywayExtras.qrImageUrl ?? mapped.qrImageUrl ?? null,
  };
}

async function createBatchPaymentIntent({ batchId, paymentOption, idempotencyKey }, { user }) {
  assertPaywayConfigured();

  if (user.role !== "Depot" && !["Admin", "Owner"].includes(user.role)) {
    throw new ForbiddenError("Batch payment is only available for Depot users");
  }

  const depot =
    user.role === "Depot" ? await depotRepository.getDepotByDepotUserId(user.sub) : null;
  if (user.role === "Depot" && !depot) {
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

  const existingPending = await paymentIntentRepository.findPendingIntentByDepotBatchId(batchId);
  const reusableBatch = await resolveReusablePendingIntent(existingPending, paymentOption);
  if (reusableBatch) {
    return buildBatchIntentResponse(reusableBatch, batchId, orders);
  }

  if (existingPending) {
    orders = await orderRepository.listOrdersByDepotBatchId(batchId);
  }

  if (orders.some((order) => order.paymentStatus === "pending")) {
    throw new BadRequestError("Some orders in this batch already have a pending payment");
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
  const expiresAt = new Date(Date.now() + INTENT_TTL_MINUTES * 60 * 1000);
  const returnParams = JSON.stringify({
    paymentId,
    batchId,
    orderIds: orderIds.map(String),
  });
  const returnDeeplink = formatReturnDeeplinkForPayway(paymentId);

  const paywayItems = orders.map((order) => ({
    name: order.itemName ? `Order #${order.id} - ${order.itemName}` : `Order #${order.id}`,
    quantity: 1,
    price: formatAmountForPayway(order.amountTotal, currency),
  }));

  const buyer = depot
    ? paywayBuyerFromDepot(depot)
    : paywayBuyerFromCustomer(
        await customerRepository.getCustomerById(firstOrder.customerId),
        firstOrder.customerName || "Customer",
      );

  const paywayResponse = await paywayClient.createPurchase({
    tranId: paywayTranId,
    amount: totalAmount,
    currency,
    paymentOption: paymentOption || "abapay_deeplink",
    returnDeeplink,
    returnParams,
    customer: buyer,
    items: paywayItems,
  });

  assertPurchaseSuccess(paywayResponse);
  const parsed = parsePurchaseResponse(paywayResponse);
  const { checkoutUrl, deeplinkUrl, qrString, playStoreUrl, appStoreUrl } = parsed;
  const option = String(paymentOption || "abapay_deeplink").toLowerCase();
  const isKhqr = option.includes("khqr");

  if (isKhqr) {
    if (!qrString && !checkoutUrl) {
      throw new BadRequestError(
        "PayWay did not return KHQR data. Check merchant settings and payment_option (abapay_khqr).",
      );
    }
  } else if (!deeplinkUrl && !checkoutUrl) {
    throw new BadRequestError(
      "PayWay did not return a payment link. Check merchant sandbox settings and payment_option.",
    );
  }

  const intent = await insertIntentRow({
    paymentId,
    masterOrderId,
    customerId: firstOrder.customerId,
    paywayTranId,
    amount: totalAmount,
    currency,
    paymentOption,
    checkoutUrl,
    deeplinkUrl,
    qrString,
    paywayResponse,
    returnParams,
    expiresAt,
    idempotencyKey: idempotencyKey || `batch-${batchId}-${Date.now()}`,
  });

  return buildBatchIntentResponse(intent, batchId, orders, {
    playStoreUrl,
    appStoreUrl,
    qrString: qrString || null,
    qrImageUrl: checkoutUrl || null,
  });
}

async function getPaymentById(paymentId, { user }) {
  let paid = await paymentRepository.getPaymentById(paymentId);
  if (paid) {
    const order = await orderRepository.getOrderById(
      (await orderRepository.listOrderDetailIdsByMasterOrderId(paid.orderId))[0] || paid.orderId,
    );
    if (order) await assertCanPayOrder(order, user);
    return mapPaymentResponseWithOrders(paid);
  }

  let intent = await paymentIntentRepository.getIntentById(paymentId);
  if (!intent) throw new NotFoundError("Payment not found");

  const order = await orderRepository.getOrderById(
    (await orderRepository.listOrderDetailIdsByMasterOrderId(intent.orderId))[0] || intent.orderId,
  );
  if (order) await assertCanPayOrder(order, user);

  const reconciled = await paywayWebhookService.reconcilePendingIntent(intent);
  if (reconciled?.status === "paid") {
    emitPaymentStatus(reconciled);
    return mapPaymentResponseWithOrders(reconciled);
  }

  return mapPaymentResponseWithOrders(intent);
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

  const intent = masterOrderId
    ? await paymentIntentRepository.findPendingIntentByMasterOrderId(masterOrderId)
    : null;
  if (intent) {
    return {
      orderId: Number(orderId),
      paymentStatus: "pending",
      payment: await mapPaymentResponseWithOrders(intent),
    };
  }

  return {
    orderId: Number(orderId),
    paymentStatus: order?.paymentStatus || "unpaid",
    payment: null,
  };
}

async function cancelPayment(paymentId, { user }) {
  const intent = await paymentIntentRepository.getIntentById(paymentId);
  if (!intent) {
    const paid = await paymentRepository.getPaymentById(paymentId);
    if (paid) throw new BadRequestError("Paid payments cannot be cancelled");
    throw new NotFoundError("Payment not found");
  }

  const order = await orderRepository.getOrderById(
    (await orderRepository.listOrderDetailIdsByMasterOrderId(intent.orderId))[0] || intent.orderId,
  );
  await assertCanPayOrder(order, user);

  await paymentIntentRepository.deleteIntentById(paymentId);
  return {
    paymentId,
    status: "cancelled",
    orderId: Number(intent.orderId),
  };
}

module.exports = {
  createPaymentIntent,
  createBatchPaymentIntent,
  getPaymentById,
  getLatestPaymentForOrder,
  cancelPayment,
  mapPaymentResponse,
  resolveMasterOrderId,
};
