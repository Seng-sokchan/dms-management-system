const crypto = require("node:crypto");
const paymentRepository = require("../repositories/payments");
const orderRepository = require("../repositories/orders");
const customerRepository = require("../repositories/customers");
const depotRepository = require("../repositories/depots");
const paywayClient = require("../integrations/payway/paywayClient");
const { parsePurchaseResponse, assertPurchaseSuccess } = require("../integrations/payway/paywayResponse");
const { assertPaywayConfigured } = require("../integrations/payway/paywayConfig");
const {
  buildPaymentReturnUrl,
  formatReturnDeeplinkForPayway,
} = require("../integrations/payway/paywayReturnDeeplink");
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

function mapPaymentResponse(payment) {
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
  };
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

  return mapPaymentResponse(payment);
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
    payment: mapPaymentResponse(payment),
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

  await paymentRepository.updatePayment(paymentId, { status: "cancelled" });
  await paymentRepository.setOrderPaymentStatus(payment.orderId, "unpaid");

  const updated = await paymentRepository.getPaymentById(paymentId);
  return mapPaymentResponse(updated);
}

module.exports = {
  createPaymentIntent,
  getPaymentById,
  getLatestPaymentForOrder,
  cancelPayment,
  mapPaymentResponse,
};
