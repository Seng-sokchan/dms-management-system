import { apiClient, authConfig, unwrapApiData } from "./apiClient";

export async function fetchSpecialDays(token) {
  const response = await apiClient.get("/special-days", authConfig(token));
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

export async function fetchOpenSpecialDays(token) {
  const response = await apiClient.get("/special-days/open", authConfig(token));
  return unwrapApiData(response.data);
}

export async function fetchMySpecialDayRegistrations(token) {
  const response = await apiClient.get("/special-days/my-registrations", authConfig(token));
  return unwrapApiData(response.data);
}

export async function registerForSpecialDay(token, id) {
  const response = await apiClient.post(`/special-days/${id}/registrations`, {}, authConfig(token));
  return unwrapApiData(response.data);
}

export async function cancelSpecialDayRegistration(token, dayId, registrationId) {
  const response = await apiClient.delete(
    `/special-days/${dayId}/registrations/${registrationId}`,
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function fetchDriverSpecialDayAssignments(token) {
  const response = await apiClient.get("/mobile/special-days/active/assignments", authConfig(token));
  return unwrapApiData(response.data);
}

export async function acceptSpecialDayAssignment(token, registrationId) {
  const response = await apiClient.post(
    `/mobile/special-days/assignments/${registrationId}/accept`,
    {},
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function fulfillSpecialDayDelivery(token, payload) {
  const response = await apiClient.post("/mobile/special-days/deliveries", payload, authConfig(token));
  return unwrapApiData(response.data);
}
