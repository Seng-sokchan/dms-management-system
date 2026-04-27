import { apiClient, authConfig } from "../apiClient";

export async function createTruck(token, payload) {
  return apiClient.post("/trucks", payload, authConfig(token));
}

export async function updateTruck(token, truckId, payload) {
  return apiClient.post(`/trucks/${truckId}`, payload, authConfig(token));
}

export async function deleteTruck(token, truckId) {
  return apiClient.delete(`/trucks/${truckId}`, authConfig(token));
}
