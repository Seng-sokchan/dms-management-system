import { apiClient, authConfig } from "../apiClient";

export async function createPayment(token, payload) {
  return apiClient.post("/payments", payload, authConfig(token));
}

export async function generatePaymentKhqr(token, payload) {
  return apiClient.post("/payments/khqr", payload, authConfig(token));
}
