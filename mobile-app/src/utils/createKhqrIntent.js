import { cancelPayment } from "../services/paymentsApi";

export function hasKhqrData(intent) {
  return Boolean(intent?.qrString || intent?.qrImageUrl);
}

/**
 * If PayWay returns a reused ABA deeplink intent (no QR), cancel and create a fresh KHQR intent.
 */
export async function createKhqrIntentWithRetry(token, createIntent) {
  let intent = await createIntent();
  if (hasKhqrData(intent)) return intent;

  if (intent?.paymentId) {
    try {
      await cancelPayment(token, intent.paymentId);
    } catch {
      /* pending intent may already be cleared server-side */
    }
    intent = await createIntent();
  }

  return intent;
}
