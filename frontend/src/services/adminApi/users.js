import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchUsers(token) {
  const response = await apiClient.get("/users", authConfig(token));
  return unwrapApiData(response.data);
}

export async function createUser(token, payload) {
  return apiClient.post("/users", payload, authConfig(token));
}

export async function updateUser(token, userId, payload) {
  return apiClient.post(`/users/${userId}`, payload, authConfig(token));
}

export async function deleteUser(token, userId) {
  return apiClient.delete(`/users/${userId}`, authConfig(token));
}
