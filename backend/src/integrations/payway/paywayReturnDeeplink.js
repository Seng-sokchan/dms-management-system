const { getPaywayConfig } = require("./paywayConfig");

/**
 * Plain merchant app URL opened after ABA payment (also used for React Navigation linking).
 */
function buildPaymentReturnUrl(paymentId) {
  let base = getPaywayConfig().returnDeeplinkBase.replace(/\/$/, "");
  if (!/\/success$/i.test(base) && base.includes("/result") && !base.endsWith("/success")) {
    base = `${base}/success`;
  }
  const sep = base.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    paymentId,
    fromAba: "1",
  });
  return `${base}${sep}${params.toString()}`;
}

/**
 * Value sent to PayWay `return_deeplink` field.
 * PayWay mobile docs: base64(JSON({ android_scheme, ios_scheme })).
 * Set PAYWAY_RETURN_DEEPLINK_MODE=plain to send the raw dms:// URL instead.
 */
function formatReturnDeeplinkForPayway(paymentId) {
  const url = buildPaymentReturnUrl(paymentId);
  const mode = String(process.env.PAYWAY_RETURN_DEEPLINK_MODE || "base64").trim().toLowerCase();
  if (mode === "plain") return url;
  const payload = JSON.stringify({
    android_scheme: url,
    ios_scheme: url,
  });
  return Buffer.from(payload, "utf8").toString("base64");
}

module.exports = {
  buildPaymentReturnUrl,
  formatReturnDeeplinkForPayway,
};
