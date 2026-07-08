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

function extractHostedCheckoutUrl(response, purchaseUrl) {
  const html = response?.raw;
  if (typeof html !== "string" || !html.trim()) return null;

  const match = html.match(/\/checkout\/[A-Za-z0-9._-]+/);
  if (!match?.[0]) return null;

  let base;
  try {
    const parsed = new URL(String(purchaseUrl || ""));
    base = `${parsed.protocol}//${parsed.host}`;
  } catch {
    base = "https://checkout.payway.com.kh";
  }
  return `${base}${match[0]}`;
}

function buildHostedCheckoutRedirectHtml(hostedUrl) {
  const safeUrl = String(hostedUrl || "").trim();
  if (!safeUrl) return null;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="refresh" content="0;url=${safeUrl}"/>
  <title>PayWay Checkout</title>
</head>
<body>
  <p>Redirecting to PayWay checkout…</p>
  <script>window.location.replace(${JSON.stringify(safeUrl)});</script>
</body>
</html>`;
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
  extractHostedCheckoutUrl,
  buildHostedCheckoutRedirectHtml,
};
