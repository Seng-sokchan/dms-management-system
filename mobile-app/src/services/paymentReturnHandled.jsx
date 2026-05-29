/** Short-lived flag so deeplink + resume handlers do not double-navigate after ABA return. */
let handledUntil = 0;
let handledPaymentId = "";

export function markPaymentReturnHandled(paymentId, ttlMs = 5000) {
  handledPaymentId = paymentId ? String(paymentId) : "";
  handledUntil = Date.now() + ttlMs;
}

export function wasPaymentReturnHandled(paymentId) {
  if (!handledPaymentId || Date.now() > handledUntil) return false;
  if (!paymentId) return true;
  return handledPaymentId === String(paymentId);
}

export function clearPaymentReturnHandled() {
  handledUntil = 0;
  handledPaymentId = "";
}
