import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchCatalogs(token) {
  const res = await apiClient.get("/catalogs", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function createCatalog(token, payload) {
  const response = await apiClient.post("/catalogs", payload, authConfig(token));
  return unwrapApiData(response.data);
}

export async function updateCatalog(token, catalogId, payload) {
  return apiClient.post(`/catalogs/${catalogId}`, payload, authConfig(token));
}

export async function deleteCatalog(token, catalogId) {
  return apiClient.delete(`/catalogs/${catalogId}`, authConfig(token));
}
