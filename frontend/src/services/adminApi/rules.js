import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchRoles(token) {
  const response = await apiClient.get("/roles", authConfig(token));
  return unwrapApiData(response.data);
}

export async function fetchMenus(token, { client } = {}) {
  const params = client ? { client } : undefined;
  const response = await apiClient.get("/menus", { ...authConfig(token), params });
  return unwrapApiData(response.data);
}

export async function fetchStatusTransitions(token) {
  const response = await apiClient.get("/status-transitions", authConfig(token));
  return unwrapApiData(response.data);
}

export async function updateStatusTransitions(token, transitions) {
  const response = await apiClient.put("/status-transitions", { transitions }, authConfig(token));
  return unwrapApiData(response.data);
}

export async function fetchRoleAccess(token) {
  const response = await apiClient.get("/role-access", authConfig(token));
  return unwrapApiData(response.data);
}

export async function updateRoleAccess(token, roleName, payload) {
  const response = await apiClient.put(`/roles/${encodeURIComponent(roleName)}/access`, payload, authConfig(token));
  return unwrapApiData(response.data);
}

export async function fetchRoleStatusPermissions(token) {
  const response = await apiClient.get("/role-status-permissions", authConfig(token));
  return unwrapApiData(response.data);
}

export async function updateRoleStatusPermissions(token, matrix) {
  const response = await apiClient.put("/role-status-permissions", { matrix }, authConfig(token));
  return unwrapApiData(response.data);
}
