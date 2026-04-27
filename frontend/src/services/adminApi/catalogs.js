import { apiClient, authConfig } from "../apiClient";

export async function createCatalog(token, payload) {
  const response = await apiClient.post("/catalogs", payload, authConfig(token));
  return response.data;
}

export async function updateCatalog(token, catalogId, payload) {
  return apiClient.post(`/catalogs/${catalogId}`, payload, authConfig(token));
}

export async function deleteCatalog(token, catalogId) {
  return apiClient.delete(`/catalogs/${catalogId}`, authConfig(token));
}
