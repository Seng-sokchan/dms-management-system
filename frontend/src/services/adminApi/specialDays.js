import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchSpecialDays(token) {
  const response = await apiClient.get("/special-days", authConfig(token));
  return unwrapApiData(response.data);
}

export async function fetchSpecialDay(token, id) {
  const response = await apiClient.get(`/special-days/${id}`, authConfig(token));
  return unwrapApiData(response.data);
}

export async function createSpecialDay(token, payload) {
  const response = await apiClient.post("/special-days", payload, authConfig(token));
  return unwrapApiData(response.data);
}

export async function updateSpecialDay(token, id, payload) {
  const response = await apiClient.patch(`/special-days/${id}`, payload, authConfig(token));
  return unwrapApiData(response.data);
}

export async function fetchSpecialDayRegistrations(token, id, params = {}) {
  const response = await apiClient.get(`/special-days/${id}/registrations`, {
    ...authConfig(token),
    params,
  });
  return unwrapApiData(response.data);
}

export async function upsertSpecialDayAssignment(token, id, payload) {
  const response = await apiClient.put(`/special-days/${id}/assignments`, payload, authConfig(token));
  return unwrapApiData(response.data);
}

export async function fetchSpecialDayProgress(token, id) {
  const response = await apiClient.get(`/special-days/${id}/progress`, authConfig(token));
  return unwrapApiData(response.data);
}
