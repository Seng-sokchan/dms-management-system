import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function createOrder(token, payload) {
  return apiClient.post("/orders", payload, authConfig(token));
}

export async function confirmDelivery(token, orderId, payload = {}) {
  return apiClient.post(`/orders/${orderId}/delivery-confirmation`, payload, authConfig(token));
}

export async function updateOrderStatus(token, orderId, payload) {
  return apiClient.post(`/orders/${orderId}/status`, payload, authConfig(token));
}

export async function moveOrderStatus(token, orderId, payload) {
  return apiClient.post(`/orders/${orderId}/move-status`, payload, authConfig(token));
}

export async function updateOrderAssignment(token, orderId, payload) {
  return apiClient.post(`/orders/${orderId}`, payload, authConfig(token));
}

export async function deleteOrder(token, orderId) {
  return apiClient.delete(`/orders/${orderId}`, authConfig(token));
}

/** @returns {Promise<{ byCustomer: object[], byDepot: object[] }>} */
export async function fetchOrderPaymentTotals(token) {
  const res = await apiClient.get("/orders/payment-totals", authConfig(token));
  const payload = unwrapApiData(res.data);
  return {
    byCustomer: Array.isArray(payload?.byCustomer) ? payload.byCustomer : [],
    byDepot: Array.isArray(payload?.byDepot) ? payload.byDepot : [],
  };
}
