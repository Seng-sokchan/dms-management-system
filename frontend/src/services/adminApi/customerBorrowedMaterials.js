import { apiClient, authConfig } from "../apiClient";

export async function upsertCustomerBorrowedMaterial(token, customerId, payload) {
  return apiClient.post(`/customers/${customerId}/borrowed-materials`, payload, authConfig(token));
}

export async function deleteCustomerBorrowedMaterial(token, customerId, materialId) {
  return apiClient.delete(
    `/customers/${customerId}/borrowed-materials/${materialId}`,
    authConfig(token),
  );
}
