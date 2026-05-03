import { apiClient, authConfig } from "../apiClient";

export async function createDepot(token, payload) {
  return apiClient.post("/depots", payload, authConfig(token));
}

export async function updateDepot(token, depotId, payload) {
  return apiClient.post(`/depots/${depotId}`, payload, authConfig(token));
}

export async function deleteDepot(token, depotId) {
  return apiClient.delete(`/depots/${depotId}`, authConfig(token));
}
