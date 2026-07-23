import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchBorrowMaterials(token) {
  const res = await apiClient.get("/borrow-materials", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function createBorrowMaterial(token, payload) {
  return apiClient.post("/borrow-materials", payload, authConfig(token));
}

export async function updateBorrowMaterial(token, materialId, payload) {
  return apiClient.post(`/borrow-materials/${materialId}`, payload, authConfig(token));
}

export async function deleteBorrowMaterial(token, materialId) {
  return apiClient.delete(`/borrow-materials/${materialId}`, authConfig(token));
}
