import { apiClient, authConfig } from "../apiClient";

export async function createOrder(token, payload) {
  return apiClient.post("/orders", payload, authConfig(token));
}

export async function confirmDelivery(token, orderId, payload) {
  return apiClient.post(`/orders/${orderId}/delivery-confirmation`, payload, authConfig(token));
}

export async function updateOrderStatus(token, orderId, payload) {
  return apiClient.post(`/orders/${orderId}/status`, payload, authConfig(token));
}

export async function updateOrderAssignment(token, orderId, payload) {
  return apiClient.post(`/orders/${orderId}`, payload, authConfig(token));
}
