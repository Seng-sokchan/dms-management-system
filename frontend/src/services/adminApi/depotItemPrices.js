import { apiClient, authConfig } from "../apiClient";

export async function fetchDepotItemPrices(token) {
  return apiClient.get("/depot-item-prices", authConfig(token));
}

export async function upsertDepotItemPrice(token, payload) {
  return apiClient.post("/depot-item-prices", payload, authConfig(token));
}

export async function deleteDepotItemPrice(token, id) {
  return apiClient.delete(`/depot-item-prices/${id}`, authConfig(token));
}
