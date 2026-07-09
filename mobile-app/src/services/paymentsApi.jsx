import { apiClient, authConfig, unwrapApiData } from "./apiClient";

export async function createBatchPaymentIntent(token, { masterOrderId, paymentOption, currency }) {
  const response = await apiClient.post(
    "/payments/batch-intents",
    { masterOrderId: Number(masterOrderId), paymentOption, currency },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function createPaymentIntent(token, { orderId, paymentOption, currency }) {
  const response = await apiClient.post(
    "/payments/intents",
    { orderId: Number(orderId), paymentOption, currency },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function getPaymentAmountOptions(token, { orderIds }) {
  const response = await apiClient.post(
    "/payments/amount-options",
    { orderIds: orderIds.map((id) => Number(id)) },
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

export async function startPaymentLiveCheck(token, paymentId) {
  const response = await apiClient.post(
    `/payments/${paymentId}/live-check/start`,
    {},
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function stopPaymentLiveCheck(token, paymentId) {
  const response = await apiClient.post(
    `/payments/${paymentId}/live-check/stop`,
    {},
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function submitPaymentPurchase(token, paymentId) {
  const response = await apiClient.post(
    `/payments/${paymentId}/purchase`,
    {},
    authConfig(token),
  );
  return unwrapApiData(response.data);
}
