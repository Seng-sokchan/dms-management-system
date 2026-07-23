import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchProvinces(token) {
  const res = await apiClient.get("/provinces", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function createProvince(token, payload) {
  const response = await apiClient.post("/provinces", payload, authConfig(token));
  return unwrapApiData(response.data);
}

export async function updateProvince(token, provinceId, payload) {
  return apiClient.post(`/provinces/${provinceId}`, payload, authConfig(token));
}

export async function deleteProvince(token, provinceId) {
  return apiClient.delete(`/provinces/${provinceId}`, authConfig(token));
}
