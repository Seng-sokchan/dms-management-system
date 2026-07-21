import { apiClient, authConfig, unwrapApiData } from "./apiClient";

export async function login(payload) {
  const response = await apiClient.post("/auth/login", payload);
  return unwrapApiData(response.data);
}

export async function fetchMe(token) {
  const response = await apiClient.get("/users/me", authConfig(token));
  return unwrapApiData(response.data);
}

export async function deleteMyAccount(token) {
  await apiClient.delete("/users/me", authConfig(token));
}
