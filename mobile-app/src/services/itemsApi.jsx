import { apiClient, authConfig, unwrapApiData } from "./apiClient";

export async function fetchItems(token) {
  const response = await apiClient.get("/items", authConfig(token));
  const payload = unwrapApiData(response.data);
  return Array.isArray(payload) ? payload : [];
}
