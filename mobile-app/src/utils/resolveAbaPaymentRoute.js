import { submitPaywayCheckoutForm } from "./paywayCheckoutClient";
import { checkAbaMobileInstalled } from "./checkAbaMobileInstalled";
import { buildAbaDeeplink } from "./buildAbaDeeplink";

/**
 * POST PayWay checkout form, detect ABA Mobile, and prefer app deeplink when available.
 * @param {{ paywayCheckout: object }} resolvedIntent
 * @returns {Promise<{ mode: 'aba_app'|'khqr_qr', qrString: string|null, qrImageUrl: string|null, deeplinkUrl?: string, playStoreUrl?: string|null, appStoreUrl?: string|null, abaInstalled: boolean }>}
 */
export async function resolveAbaPaymentRoute(resolvedIntent) {
  const paywayCheckout = resolvedIntent?.paywayCheckout;
  if (!paywayCheckout) {
    throw new Error("PayWay checkout form is incomplete");
  }

  const purchase = await submitPaywayCheckoutForm(paywayCheckout);
  const { qrString, qrImageUrl, playStoreUrl, appStoreUrl } = purchase;
  const deeplinkUrl = purchase.deeplinkUrl || buildAbaDeeplink(qrString);
  const abaInstalled = deeplinkUrl ? await checkAbaMobileInstalled(deeplinkUrl) : false;

  if (abaInstalled && deeplinkUrl) {
    return {
      mode: "aba_app",
      deeplinkUrl,
      qrString,
      qrImageUrl,
      playStoreUrl,
      appStoreUrl,
      abaInstalled: true,
    };
  }

  return {
    mode: "khqr_qr",
    qrString,
    qrImageUrl,
    deeplinkUrl,
    playStoreUrl,
    appStoreUrl,
    abaInstalled: false,
  };
}
