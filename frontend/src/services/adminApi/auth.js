import { apiClient, unwrapApiData } from "../apiClient";

/** Login / session (no token) */
export async function login(payload) {
  const response = await apiClient.post("/auth/login", payload);
  return unwrapApiData(response.data);
}
