const crypto = require("node:crypto");
const paymentRepository = require("../repositories/payments");
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
const { getPool } = require("../db/pool");
const paywayWebhookService = require("./paywayWebhookService");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../errors");
const INTENT_TTL_MINUTES = 30;

function generatePaywayTranId() {
  return crypto.randomBytes(10).toString("hex");
}

/** Plain dms:// URL for mobile Linking (API response `returnDeeplink`). */
function buildReturnDeeplink(paymentId) {
  return buildPaymentReturnUrl(paymentId);
}

function mapPaymentResponse(payment, extra = {}) {
  return {
    paymentId: payment.id,
    orderId: Number(payment.orderId),
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    checkoutUrl: payment.checkoutUrl || null,
    deeplinkUrl: payment.deeplinkUrl || null,
    returnDeeplink: buildReturnDeeplink(payment.id),
    expiresAt: payment.expiresAt,
    paidAt: payment.paidAt,
    playStoreUrl: payment.playStoreUrl || null,
    appStoreUrl: payment.appStoreUrl || null,
    ...extra,
  };
}

async function mapPaymentResponseWithOrders(payment, extra = {}) {
  const orderIds = await paymentRepository.listOrderIdsByPaymentId(payment.id);
  const mapped = mapPaymentResponse(payment, extra);
  if (orderIds.length > 0) {
    mapped.orderIds = orderIds.map((id) => Number(id));
  }
  return mapped;
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

async function createPaymentIntent({ orderId, paymentOption, idempotencyKey }, { user }) {
  assertPaywayConfigured();

  const order = await orderRepository.getOrderById(orderId);
  const orderCustomer = await assertCanPayOrder(order, user);

  if (order.paymentStatus === "paid") {
    throw new BadRequestError("Order is already paid");
  }

  const existing = await paymentRepository.findPendingPaymentByOrderId(orderId);
  if (existing) {
    return mapPaymentResponse(existing);
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

  const payment = await paymentRepository.insertPayment({
    id: paymentId,
    orderId,
    customerId: order.customerId,
    paywayTranId,
    amount: order.amountTotal,
    currency: order.currency,
    status: "pending",
    paymentOption: paymentOption || "abapay_deeplink",
    checkoutUrl,
    deeplinkUrl,
    rawCreateResponse: paywayResponse,
    expiresAt,
    idempotencyKey: idempotencyKey || `intent-${orderId}-${Date.now()}`,
  });

  await paymentRepository.setOrderPaymentStatus(orderId, "pending");

  const mapped = mapPaymentResponse(payment);
  return {
    ...mapped,
    playStoreUrl,
    appStoreUrl,
    qrString: qrString || null,
    qrImageUrl: checkoutUrl || null,
  };
}

async function buildBatchIntentResponse(payment, batchId, orders, paywayExtras = {}) {
  const orderIds = orders?.length
    ? orders.map((order) => Number(order.id))
    : (await paymentRepository.listOrderIdsByPaymentId(payment.id)).map((id) => Number(id));
  const mapped = mapPaymentResponse(payment, { batchId, orderIds });
  return {
    ...mapped,
    playStoreUrl: paywayExtras.playStoreUrl || null,
    appStoreUrl: paywayExtras.appStoreUrl || null,
    qrString: paywayExtras.qrString || null,
    qrImageUrl: paywayExtras.qrImageUrl || null,
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

  const orders = await orderRepository.listOrdersByDepotBatchId(batchId);
  if (!orders.length) {
    throw new NotFoundError("No orders found for this batch");
  }

  for (const order of orders) {
    await assertCanPayOrder(order, user);
  }

  if (orders.some((order) => order.paymentStatus === "paid")) {
    throw new BadRequestError("Some orders in this batch are already paid");
  }

  const existingPending = await paymentRepository.findPendingBatchPaymentByDepotBatchId(batchId);
  if (existingPending) {
    return buildBatchIntentResponse(existingPending, batchId, orders);
  }

  if (orders.some((order) => order.paymentStatus === "pending")) {
    throw new BadRequestError("Some orders in this batch already have a pending payment");
  }

  if (orders.some((order) => order.paymentStatus === "failed")) {
    throw new BadRequestError("Some orders in this batch have a failed payment status");
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

  const pool = getPool();
  const conn = await pool.getConnection();
  let payment;
  try {
    await conn.beginTransaction();
    payment = await paymentRepository.insertPayment(
      {
        id: paymentId,
        orderId: firstOrder.id,
        customerId: firstOrder.customerId,
        paywayTranId,
        amount: totalAmount,
        currency,
        status: "pending",
        paymentOption: paymentOption || "abapay_deeplink",
        checkoutUrl,
        deeplinkUrl,
        rawCreateResponse: paywayResponse,
        expiresAt,
        idempotencyKey: idempotencyKey || `batch-${batchId}-${Date.now()}`,
      },
      conn,
    );
    await paymentRepository.insertPaymentOrders(paymentId, orderIds, conn);
    await paymentRepository.setOrdersPaymentStatus(orderIds, "pending", conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  return buildBatchIntentResponse(payment, batchId, orders, {
    playStoreUrl,
    appStoreUrl,
    qrString: qrString || null,
    qrImageUrl: checkoutUrl || null,
  });
}

async function getPaymentById(paymentId, { user }) {
  let payment = await paymentRepository.getPaymentById(paymentId);
  if (!payment) throw new NotFoundError("Payment not found");

  const order = await orderRepository.getOrderById(payment.orderId);
  await assertCanPayOrder(order, user);

  if (payment.status === "pending" && payment.paywayTranId) {
    const reconciled = await paywayWebhookService.reconcilePendingPayment(payment);
    if (reconciled?.status === "paid" && reconciled.status !== payment.status) {
      emitPaymentStatus(reconciled);
    }
    payment = reconciled;
  }

  return mapPaymentResponseWithOrders(payment);
}

async function getLatestPaymentForOrder(orderId, { user }) {
  const order = await orderRepository.getOrderById(orderId);
  await assertCanPayOrder(order, user);

  const payment = await paymentRepository.getLatestPaymentByOrderId(orderId);
  if (!payment) {
    return {
      orderId: Number(orderId),
      paymentStatus: order.paymentStatus || "unpaid",
      payment: null,
    };
  }

  return {
    orderId: Number(orderId),
    paymentStatus: order.paymentStatus || payment.status,
    payment: await mapPaymentResponseWithOrders(payment),
  };
}

async function cancelPayment(paymentId, { user }) {
  const payment = await paymentRepository.getPaymentById(paymentId);
  if (!payment) throw new NotFoundError("Payment not found");
  if (payment.status !== "pending") {
    throw new BadRequestError("Only pending payments can be cancelled");
  }

  const order = await orderRepository.getOrderById(payment.orderId);
  await assertCanPayOrder(order, user);

  const linkedOrderIds = await paymentRepository.listOrderIdsByPaymentId(paymentId);
  await paymentRepository.updatePayment(paymentId, { status: "cancelled" });
  if (linkedOrderIds.length > 0) {
    await paymentRepository.setOrdersPaymentStatus(linkedOrderIds, "unpaid");
  } else {
    await paymentRepository.setOrderPaymentStatus(payment.orderId, "unpaid");
  }

  const updated = await paymentRepository.getPaymentById(paymentId);
  return mapPaymentResponseWithOrders(updated);
}

module.exports = {
  createPaymentIntent,
  createBatchPaymentIntent,
  getPaymentById,
  getLatestPaymentForOrder,
  cancelPayment,
  mapPaymentResponse,
};
