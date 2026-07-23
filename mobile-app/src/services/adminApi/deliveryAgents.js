import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchDeliveryAgents(token) {
  const res = await apiClient.get("/delivery-agents", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function createDeliveryAgent(token, payload) {
  return apiClient.post("/delivery-agents", payload, authConfig(token));
}

export async function updateDeliveryAgent(token, deliveryAgentId, payload) {
  return apiClient.post(`/delivery-agents/${deliveryAgentId}`, payload, authConfig(token));
}

export async function deleteDeliveryAgent(token, deliveryAgentId) {
  return apiClient.delete(`/delivery-agents/${deliveryAgentId}`, authConfig(token));
}
