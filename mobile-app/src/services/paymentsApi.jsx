import { apiClient, authConfig, unwrapApiData } from "./apiClient";

export async function createBatchPaymentIntent(token, { batchId, paymentOption }) {
  const response = await apiClient.post(
    "/payments/batch-intents",
    { batchId: String(batchId), paymentOption },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function createPaymentIntent(token, { orderId, paymentOption }) {
  const response = await apiClient.post(
    "/payments/intents",
    { orderId: Number(orderId), paymentOption },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function getPayment(token, paymentId) {
  const response = await apiClient.get(`/payments/${paymentId}`, authConfig(token));
  return unwrapApiData(response.data);
}

export async function getOrderPayment(token, orderId) {
  const response = await apiClient.get(`/orders/${orderId}/payment`, authConfig(token));
  return unwrapApiData(response.data);
}

export async function cancelPayment(token, paymentId) {
  const response = await apiClient.post(`/payments/${paymentId}/cancel`, {}, authConfig(token));
  return unwrapApiData(response.data);
}
