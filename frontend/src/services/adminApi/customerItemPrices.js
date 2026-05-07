import { apiClient, authConfig } from "../apiClient";

export async function fetchCustomerItemPrices(token) {
  return apiClient.get("/customer-item-prices", authConfig(token));
}

export async function upsertCustomerItemPrice(token, payload) {
  return apiClient.post("/customer-item-prices", payload, authConfig(token));
}

export async function deleteCustomerItemPrice(token, id) {
  return apiClient.delete(`/customer-item-prices/${id}`, authConfig(token));
}
