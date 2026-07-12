const { hashForPurchase, hashForCheckTransaction } = require("./paywayHash");
const {
  getPaywayConfig,
  assertPaywayConfigured,
  formatPaywayReqTime,
  formatAmountForPayway,
  encodeItemsBase64,
  encodeReturnUrl,
} = require("./paywayConfig");

async function postForm(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      Referer: process.env.PAYWAY_REFERER || process.env.FRONTEND_URL || "",
    },
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!response.ok) {
    const err = new Error(json?.status?.message || json?.description || "PayWay request failed");
    err.status = 502;
    err.code = "PAYWAY_HTTP_ERROR";
    err.details = json;
    throw err;
  }
  return json;
}

const DEFAULT_PAYMENT_OPTION = "abapay_khqr_deeplink";
const HOSTED_VIEW_TYPE = "hosted_view";

function isCheckoutPaymentOption(paymentOption) {
  const option = String(paymentOption || "").toLowerCase();
  return option === "checkout" || option === "payway_checkout";
}

function resolvePaymentOptionForPayway(paymentOption) {
  if (isCheckoutPaymentOption(paymentOption)) return DEFAULT_PAYMENT_OPTION;
  return paymentOption || DEFAULT_PAYMENT_OPTION;
}

function getCheckoutScriptUrl() {
  // PayWay hosts checkout2-0.js on checkout.payway.com.kh even for sandbox purchases (Dev/index.php).
  return "https://checkout.payway.com.kh/plugins/checkout2-0.js";
}

function resolveCheckoutPluginBase(purchaseUrl) {
  try {
    const host = new URL(String(purchaseUrl || "")).host;
    if (host.includes("checkout-sandbox.payway.com.kh")) {
      return "https://checkout-sandbox.payway.com.kh";
    }
  } catch {
    // fall through
  }
  return "https://checkout.payway.com.kh";
}

function buildPurchaseFormFields({
  tranId,
  amount,
  currency,
  paymentOption,
  returnDeeplink,
  returnParams,
  customer,
  itemLabel,
  items,
  reqTime,
}) {
  const cfg = assertPaywayConfigured();
  const amountStr = formatAmountForPayway(amount, currency);
  if (!amountStr) {
    const err = new Error("Invalid payment amount");
    err.status = 400;
    err.code = "INVALID_AMOUNT";
    throw err;
  }

  const purchaseItems = Array.isArray(items) && items.length > 0
    ? items
    : [{ name: itemLabel || "Order", quantity: 1, price: amountStr }];

  const itemsB64 = encodeItemsBase64(
    purchaseItems.map((entry) => ({
      name: entry.name || "Order",
      quantity: entry.quantity ?? 1,
      price: entry.price,
    })),
  );

  return {
    hashFields: {
      req_time: reqTime || formatPaywayReqTime(),
      merchant_id: cfg.merchantId,
      tran_id: tranId,
      amount: amountStr,
      items: itemsB64,
      shipping: "",
      ctid: "",
      pwt: "",
      firstname: customer?.firstName || "Customer",
      lastname: customer?.lastName || "User",
      email: customer?.email || "customer@example.com",
      phone: customer?.phone || "0000000000",
      type: "purchase",
      payment_option: resolvePaymentOptionForPayway(paymentOption),
      // Server pushback URL (Base64). Do not use callback_url for ecommerce checkout.
      return_url: encodeReturnUrl(cfg.callbackUrl),
      cancel_url: "",
      continue_success_url: "",
      return_deeplink: returnDeeplink || "",
      currency: String(currency || "KHR").toUpperCase(),
      custom_fields: "",
      return_params: returnParams || "",
    },
    cfg,
  };
}

function appendPaywayExtras(fields) {
  // view_type is not part of the purchase hash (PayWay v2 docs).
  fields.view_type = HOSTED_VIEW_TYPE;
  return fields;
}

function buildPaywayCheckoutForm(params) {
  const { hashFields, cfg } = buildPurchaseFormFields(params);
  const hash = hashForPurchase(hashFields, cfg.apiKey);
  const fields = appendPaywayExtras({ ...hashFields, hash });
  return {
    action: cfg.purchaseUrl,
    fields,
    scriptUrl: getCheckoutScriptUrl(),
    pluginBase: resolveCheckoutPluginBase(cfg.purchaseUrl),
    referer: process.env.PAYWAY_REFERER || process.env.FRONTEND_URL || process.env.MOBILE_URL || "",
  };
}

async function submitCheckoutForm(paywayCheckout) {
  if (!paywayCheckout?.action || !paywayCheckout?.fields) {
    const err = new Error("PayWay checkout form is incomplete");
    err.status = 400;
    err.code = "PAYWAY_FORM_INCOMPLETE";
    throw err;
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(paywayCheckout.fields)) {
    if (value !== "" && value != null) {
      form.append(key, String(value));
    }
  }
  return postForm(paywayCheckout.action, form);
}

/**
 * Create PayWay purchase (multipart form-data).
 * @returns {Promise<object>} PayWay response (checkout URL, deeplink, etc.)
 */
async function createPurchase(params) {
  const { hashFields, cfg } = buildPurchaseFormFields(params);
  const hash = hashForPurchase(hashFields, cfg.apiKey);
  const form = new FormData();
  for (const [key, value] of Object.entries(hashFields)) {
    if (value !== "" && value != null) {
      form.append(key, String(value));
    }
  }
  form.append("hash", hash);
  form.append("view_type", HOSTED_VIEW_TYPE);

  return postForm(cfg.purchaseUrl, form);
}

/**
 * Check transaction status with PayWay (required before marking paid).
 */
async function checkTransaction(tranId) {
  const cfg = assertPaywayConfigured();
  const reqTime = formatPaywayReqTime();
  const hash = hashForCheckTransaction(reqTime, cfg.merchantId, tranId, cfg.apiKey);

  const form = new FormData();
  form.append("req_time", reqTime);
  form.append("merchant_id", cfg.merchantId);
  form.append("tran_id", tranId);
  form.append("hash", hash);

  return postForm(cfg.checkUrl, form);
}

function isApprovedCheckResponse(body) {
  if (!body || typeof body !== "object") return false;

  const description = String(body.description || "").trim().toLowerCase();
  if (description === "approved" || description === "preauth_approved") return true;

  const status = body.payment_status ?? body.status ?? body.data?.payment_status;
  if (typeof status === "string") {
    const upper = status.toUpperCase();
    return upper === "APPROVED" || upper === "PAID" || upper === "PREAUTH_APPROVED" || status === "0";
  }
  if (typeof status === "number" && status === 0) return true;
  if (body.status?.code === "00" || body.status === 0) return true;

  const paymentStatus = String(body.payment_status || "").toUpperCase();
  return paymentStatus === "APPROVED" || paymentStatus === "PAID";
}

module.exports = {
  createPurchase,
  buildPaywayCheckoutForm,
  submitCheckoutForm,
  getCheckoutScriptUrl,
  resolveCheckoutPluginBase,
  isCheckoutPaymentOption,
  resolvePaymentOptionForPayway,
  DEFAULT_PAYMENT_OPTION,
  HOSTED_VIEW_TYPE,
  checkTransaction,
  isApprovedCheckResponse,
};
