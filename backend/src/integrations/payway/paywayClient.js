const { hashForPurchase, hashForCheckTransaction } = require("./paywayHash");
const {
  assertPaywayConfigured,
  formatPaywayReqTime,
  formatAmountForPayway,
  encodeItemsBase64,
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

/**
 * Create PayWay purchase (multipart form-data).
 * @returns {Promise<object>} PayWay response (checkout URL, deeplink, etc.)
 */
async function createPurchase({
  tranId,
  amount,
  currency,
  paymentOption,
  returnDeeplink,
  returnParams,
  customer,
  itemLabel,
  items,
}) {
  const cfg = assertPaywayConfigured();
  const reqTime = formatPaywayReqTime();
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

  const hashFields = {
    req_time: reqTime,
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
    payment_option: paymentOption || "abapay_deeplink",
    return_url: "",
    cancel_url: "",
    continue_success_url: "",
    return_deeplink: returnDeeplink || "",
    currency: String(currency || "KHR").toUpperCase(),
    custom_fields: "",
    return_params: returnParams || "",
  };

  const hash = hashForPurchase(hashFields, cfg.apiKey);
  const form = new FormData();
  for (const [key, value] of Object.entries(hashFields)) {
    if (value !== "" && value != null) {
      form.append(key, String(value));
    }
  }
  form.append("hash", hash);
  if (cfg.callbackUrl) {
    form.append("callback_url", cfg.callbackUrl);
  }

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
  checkTransaction,
  isApprovedCheckResponse,
};
