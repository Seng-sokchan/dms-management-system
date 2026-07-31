import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchCustomerPriorities(token, provinceId) {
  const response = await apiClient.get("/customer-priorities", {
    ...authConfig(token),
    params: { provinceId },
  });
  return unwrapApiData(response.data);
}

export async function saveCustomerPriorities(token, payload) {
  const response = await apiClient.post("/customer-priorities", payload, authConfig(token));
  return unwrapApiData(response.data);
}
