import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchAdminCustomers(token) {
  const res = await apiClient.get("/customers", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function createCustomer(token, payload) {
  return apiClient.post("/customers", payload, authConfig(token));
}

export async function updateCustomer(token, customerId, payload) {
  return apiClient.post(`/customers/${customerId}`, payload, authConfig(token));
}

export async function deleteCustomer(token, customerId) {
  return apiClient.delete(`/customers/${customerId}`, authConfig(token));
}
