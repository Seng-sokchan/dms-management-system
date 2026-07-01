import { getPayment } from "../services/paymentsApi";

export async function resolvePaywayCheckoutIntent(token, intent) {
  if (intent?.paywayCheckout) return intent;
  if (!token || !intent?.paymentId) return intent;

  try {
    const payment = await getPayment(token, intent.paymentId);
    if (payment?.paywayCheckout) {
      return { ...intent, paywayCheckout: payment.paywayCheckout };
    }
  } catch {
    // Fall through to caller error handling.
  }

  return intent;
}
