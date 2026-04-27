import { apiClient, authConfig } from "../apiClient";

export async function fetchAddresses(token) {
  const response = await apiClient.get("/addresses", authConfig(token));
  return response.data;
}
