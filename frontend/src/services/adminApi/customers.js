import { apiClient, authConfig } from "../apiClient";

export async function createCustomer(token, payload) {
  return apiClient.post("/customers", payload, authConfig(token));
}

export async function fetchCustomerUsers(token) {
  return apiClient.get("/customer-users", authConfig(token));
}

export async function updateCustomer(token, customerId, payload) {
  return apiClient.post(`/customers/${customerId}`, payload, authConfig(token));
}

export async function deleteCustomer(token, customerId) {
  return apiClient.delete(`/customers/${customerId}`, authConfig(token));
}
