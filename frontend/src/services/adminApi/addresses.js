import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchAddresses(token) {
  const response = await apiClient.get("/addresses", authConfig(token));
  return unwrapApiData(response.data);
}
