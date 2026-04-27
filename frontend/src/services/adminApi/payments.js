import { apiClient, authConfig } from "../apiClient";

export async function createPayment(token, payload) {
  return apiClient.post("/payments", payload, authConfig(token));
}
