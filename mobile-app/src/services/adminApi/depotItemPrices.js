import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchDepotItemPrices(token) {
  const res = await apiClient.get("/depot-item-prices", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function upsertDepotItemPrice(token, payload) {
  return apiClient.post("/depot-item-prices", payload, authConfig(token));
}

export async function deleteDepotItemPrice(token, id) {
  return apiClient.delete(`/depot-item-prices/${id}`, authConfig(token));
}
