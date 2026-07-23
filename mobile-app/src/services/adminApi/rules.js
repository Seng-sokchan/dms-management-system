import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchRoles(token) {
  const response = await apiClient.get("/roles", authConfig(token));
  return unwrapApiData(response.data);
}
