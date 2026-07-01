import { submitPaywayCheckoutForm } from "./paywayCheckoutClient";
import { checkAbaMobileInstalled } from "./checkAbaMobileInstalled";
import { buildAbaDeeplink } from "./buildAbaDeeplink";

/**
 * POST PayWay checkout form and choose ABA app vs KHQR QR based on install detection.
 * @param {{ paywayCheckout: object }} resolvedIntent
 * @returns {Promise<{ mode: 'aba_app'|'khqr_qr', qrString: string|null, qrImageUrl: string|null, deeplinkUrl?: string }>}
 */
export async function resolveAbaPaymentRoute(resolvedIntent) {
  const paywayCheckout = resolvedIntent?.paywayCheckout;
  if (!paywayCheckout) {
    throw new Error("PayWay checkout form is incomplete");
  }

  const purchase = await submitPaywayCheckoutForm(paywayCheckout);
  const { qrString, qrImageUrl } = purchase;

  const installed = await checkAbaMobileInstalled();
  if (installed) {
    const deeplinkUrl = buildAbaDeeplink(qrString);
    if (deeplinkUrl) {
      return { mode: "aba_app", deeplinkUrl, qrString, qrImageUrl };
    }
  }

  return { mode: "khqr_qr", qrString, qrImageUrl };
}
