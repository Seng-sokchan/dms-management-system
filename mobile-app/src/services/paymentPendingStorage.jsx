import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dms:pending-payment-return";

export async function setPendingPaymentReturn({ paymentId, orderId, batchId, orderIds, role }) {
  if (!paymentId) return;
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({
      paymentId: String(paymentId),
      orderId: orderId != null ? String(orderId) : null,
      batchId: batchId != null ? String(batchId) : null,
      orderIds: Array.isArray(orderIds) ? orderIds.map(String) : null,
      role: role || "Customer",
      savedAt: Date.now(),
    }),
  );
}

export async function getPendingPaymentReturn() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.paymentId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPendingPaymentReturn() {
  await AsyncStorage.removeItem(KEY);
}
