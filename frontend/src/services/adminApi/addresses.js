import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchAddresses(token) {
  const response = await apiClient.get("/addresses", authConfig(token));
  return unwrapApiData(response.data);
}

export async function createAddress(token, payload) {
  const response = await apiClient.post("/addresses", payload, authConfig(token));
  return unwrapApiData(response.data);
}

export async function updateAddress(token, addressId, payload) {
  const response = await apiClient.post(`/addresses/${addressId}`, payload, authConfig(token));
  return unwrapApiData(response.data);
}

export async function deleteAddress(token, addressId) {
  await apiClient.delete(`/addresses/${addressId}`, authConfig(token));
}
