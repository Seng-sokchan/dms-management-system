/** Normalize PayWay purchase API JSON into checkout/deeplink URLs. */

function unescapeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().replace(/\\\//g, "/");
}

/**
 * @param {object|null} response PayWay purchase response
 * @returns {{ deeplinkUrl: string|null, checkoutUrl: string|null, qrString: string|null, playStoreUrl: string|null, appStoreUrl: string|null }}
 */
function parsePurchaseResponse(response) {
  if (!response || typeof response !== "object") {
    return {
      deeplinkUrl: null,
      checkoutUrl: null,
      qrString: null,
      playStoreUrl: null,
      appStoreUrl: null,
    };
  }

  const root = response.data && typeof response.data === "object" ? response.data : response;

  let deeplinkUrl = unescapeUrl(root.abapay_deeplink || root.deeplink);
  const qrString = root.qrString || root.qr_string || null;
  if (!deeplinkUrl && qrString) {
    deeplinkUrl = `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(String(qrString))}`;
  }

  const checkoutUrl = unescapeUrl(
    root.checkout_qr_url || root.checkout_url || root.qr_image_url || root.payment_url,
  );

  return {
    deeplinkUrl,
    checkoutUrl,
    qrString: qrString ? String(qrString) : null,
    playStoreUrl: unescapeUrl(root.play_store),
    appStoreUrl: unescapeUrl(root.app_store),
  };
}

function assertPurchaseSuccess(response) {
  const code = response?.status?.code ?? response?.status;
  if (code == null) return;
  if (String(code) === "00" || code === 0) return;
  const message =
    response?.status?.message || response?.description || `PayWay error (code ${code})`;
  const err = new Error(message);
  err.status = 502;
  err.code = "PAYWAY_REJECTED";
  err.details = response;
  throw err;
}

module.exports = {
  parsePurchaseResponse,
  assertPurchaseSuccess,
};
