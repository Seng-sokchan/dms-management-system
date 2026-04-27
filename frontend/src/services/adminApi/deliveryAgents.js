import { apiClient, authConfig } from "../apiClient";

export async function createDeliveryAgent(token, payload) {
  return apiClient.post("/delivery-agents", payload, authConfig(token));
}

export async function updateDeliveryAgent(token, deliveryAgentId, payload) {
  return apiClient.post(`/delivery-agents/${deliveryAgentId}`, payload, authConfig(token));
}

export async function deleteDeliveryAgent(token, deliveryAgentId) {
  return apiClient.delete(`/delivery-agents/${deliveryAgentId}`, authConfig(token));
}
