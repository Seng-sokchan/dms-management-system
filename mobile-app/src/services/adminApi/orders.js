import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchOrders(token) {
  const res = await apiClient.get("/orders", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function updateOrderAssignment(token, orderId, payload) {
  return apiClient.post(`/orders/${orderId}`, payload, authConfig(token));
}

export async function moveOrderStatus(token, orderId, payload) {
  return apiClient.post(`/orders/${orderId}/move-status`, payload, authConfig(token));
}

export async function assignOrdersToAgent(token, orderIds, deliveryAgentId) {
  const ids = Array.isArray(orderIds) ? orderIds : [];
  await Promise.all(
    ids.map((orderId) => updateOrderAssignment(token, orderId, { deliveryAgentId: deliveryAgentId || null })),
  );
}

export async function submitOrderToFactory(token, orderId) {
  return moveOrderStatus(token, orderId, { status: "Sent_To_Factory" });
}

export async function fetchOrderPaymentTotals(token) {
  const res = await apiClient.get("/orders/payment-totals", authConfig(token));
  const payload = unwrapApiData(res.data);
  return {
    byCustomer: Array.isArray(payload?.byCustomer) ? payload.byCustomer : [],
    byDepot: Array.isArray(payload?.byDepot) ? payload.byDepot : [],
  };
}
