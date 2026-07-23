import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchCustomerItemPrices(token) {
  const res = await apiClient.get("/customer-item-prices", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function upsertCustomerItemPrice(token, payload) {
  return apiClient.post("/customer-item-prices", payload, authConfig(token));
}

export async function deleteCustomerItemPrice(token, id) {
  return apiClient.delete(`/customer-item-prices/${id}`, authConfig(token));
}
