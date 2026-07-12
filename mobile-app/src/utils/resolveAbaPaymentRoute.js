import { submitPaymentPurchase } from "../services/paymentsApi";
import { submitPaywayCheckoutForm } from "./paywayCheckoutClient";
import { checkAbaMobileInstalled } from "./checkAbaMobileInstalled";
import { buildAbaDeeplink } from "./buildAbaDeeplink";

async function loadPaywayPurchase(resolvedIntent, token) {
  const paymentId = resolvedIntent?.paymentId;
  const paywayCheckout = resolvedIntent?.paywayCheckout;

  if (token && paymentId) {
    return submitPaymentPurchase(token, paymentId);
  }
  if (paywayCheckout) {
    return submitPaywayCheckoutForm(paywayCheckout);
  }
  throw new Error("PayWay checkout form is incomplete");
}

/**
 * Resolve PayWay purchase via backend proxy (preferred) or direct form POST, then pick ABA app vs hosted checkout.
 * @param {{ paymentId?: string, paywayCheckout?: object }} resolvedIntent
 * @param {string} [token]
 */
export async function resolveAbaPaymentRoute(resolvedIntent, token) {
  const purchase = await loadPaywayPurchase(resolvedIntent, token);
  const { qrString, qrImageUrl, checkoutQrUrl, playStoreUrl, appStoreUrl } = purchase;
  const deeplinkUrl = purchase.deeplinkUrl || buildAbaDeeplink(qrString);
  const abaInstalled = deeplinkUrl ? await checkAbaMobileInstalled(deeplinkUrl) : false;

  if (abaInstalled && deeplinkUrl) {
    return {
      mode: "aba_app",
      deeplinkUrl,
      qrString,
      qrImageUrl,
      checkoutQrUrl,
      playStoreUrl,
      appStoreUrl,
      abaInstalled: true,
    };
  }

  // Prefer PayWay hosted checkout (checkout_qr_url) for guideline-compliant KHQR UI.
  if (checkoutQrUrl) {
    return {
      mode: "webview",
      deeplinkUrl,
      qrString,
      qrImageUrl,
      checkoutQrUrl,
      playStoreUrl,
      appStoreUrl,
      abaInstalled: false,
    };
  }

  return {
    mode: "khqr_qr",
    qrString,
    qrImageUrl,
    checkoutQrUrl,
    deeplinkUrl,
    playStoreUrl,
    appStoreUrl,
    abaInstalled: false,
  };
}
