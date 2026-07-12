function getPaywayConfig() {
  const apiKey = String(process.env.PAYWAY_API_KEY || "").trim();
  const merchantId = String(process.env.PAYWAY_MERCHANT_ID || "").trim();
  const purchaseUrl = String(
    process.env.PAYWAY_PURCHASE_URL
      || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  ).trim();
  const checkUrl = String(
    process.env.PAYWAY_CHECK_URL
      || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2",
  ).trim();
  const callbackUrl = String(process.env.PAYWAY_CALLBACK_URL || "").trim();
  const returnDeeplinkBase = String(
    process.env.PAYWAY_RETURN_DEEPLINK_BASE || "dms://payment/result/success",
  ).trim();

  return {
    apiKey,
    merchantId,
    purchaseUrl,
    checkUrl,
    callbackUrl,
    returnDeeplinkBase,
    isConfigured: Boolean(apiKey && merchantId && callbackUrl),
  };
}

function assertPaywayConfigured() {
  const cfg = getPaywayConfig();
  if (!cfg.isConfigured) {
    const err = new Error("PayWay is not configured (PAYWAY_API_KEY, PAYWAY_MERCHANT_ID, PAYWAY_CALLBACK_URL)");
    err.status = 503;
    err.code = "PAYWAY_NOT_CONFIGURED";
    throw err;
  }
  return cfg;
}

function formatPaywayReqTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    String(date.getUTCFullYear())
    + pad(date.getUTCMonth() + 1)
    + pad(date.getUTCDate())
    + pad(date.getUTCHours())
    + pad(date.getUTCMinutes())
    + pad(date.getUTCSeconds())
  );
}

function formatAmountForPayway(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (String(currency).toUpperCase() === "KHR") {
    return String(Math.round(n));
  }
  return n.toFixed(2);
}

function encodeItemsBase64(items) {
  const payload = items.map((row) => ({
    name: String(row.name || "Order"),
    quantity: Number(row.quantity || 1),
    price: String(row.price),
  }));
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

/** PayWay `return_url` must be Base64-encoded (server pushback / webhook URL). */
function encodeReturnUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  return Buffer.from(value, "utf8").toString("base64");
}

module.exports = {
  getPaywayConfig,
  assertPaywayConfigured,
  formatPaywayReqTime,
  formatAmountForPayway,
  encodeItemsBase64,
  encodeReturnUrl,
};
