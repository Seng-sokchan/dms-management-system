import { apiClient, authConfig } from "../apiClient";

export async function createProducer(token, payload) {
  return apiClient.post("/producers", payload, authConfig(token));
}

export async function updateProducer(token, producerId, payload) {
  return apiClient.post(`/producers/${producerId}`, payload, authConfig(token));
}

export async function deleteProducer(token, producerId) {
  return apiClient.delete(`/producers/${producerId}`, authConfig(token));
}
