import { apiClient, authConfig } from "../apiClient";

export async function createBorrowMaterial(token, payload) {
  return apiClient.post("/borrow-materials", payload, authConfig(token));
}

export async function updateBorrowMaterial(token, materialId, payload) {
  return apiClient.post(`/borrow-materials/${materialId}`, payload, authConfig(token));
}

export async function deleteBorrowMaterial(token, materialId) {
  return apiClient.delete(`/borrow-materials/${materialId}`, authConfig(token));
}
