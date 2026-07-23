import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchDepots(token) {
  const res = await apiClient.get("/depots", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function createDepot(token, payload) {
  return apiClient.post("/depots", payload, authConfig(token));
}

export async function updateDepot(token, depotId, payload) {
  return apiClient.post(`/depots/${depotId}`, payload, authConfig(token));
}

export async function deleteDepot(token, depotId) {
  return apiClient.delete(`/depots/${depotId}`, authConfig(token));
}
