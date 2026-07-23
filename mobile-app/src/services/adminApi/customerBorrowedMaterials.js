import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchCustomerBorrowedMaterials(token) {
  const res = await apiClient.get("/customer-borrowed-materials", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function upsertCustomerBorrowedMaterial(token, customerId, payload) {
  return apiClient.post(`/customers/${customerId}/borrowed-materials`, payload, authConfig(token));
}

export async function deleteCustomerBorrowedMaterial(token, customerId, materialId) {
  return apiClient.delete(
    `/customers/${customerId}/borrowed-materials/${materialId}`,
    authConfig(token),
  );
}
