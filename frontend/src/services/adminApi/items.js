import { apiClient, authConfig } from "../apiClient";

export async function createItem(token, payload) {
  return apiClient.post("/items", payload, authConfig(token));
}

export async function updateItem(token, itemId, payload) {
  return apiClient.post(`/items/${itemId}`, payload, authConfig(token));
}

export async function deleteItem(token, itemId) {
  return apiClient.delete(`/items/${itemId}`, authConfig(token));
}
