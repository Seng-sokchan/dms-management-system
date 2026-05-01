import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function createPayment(token, payload) {
  return apiClient.post("/payments", payload, authConfig(token));
}

export async function generatePaymentKhqr(token, payload) {
  return apiClient.post("/payments/khqr", payload, authConfig(token));
}

export async function checkPaymentKhqrByMd5List(token, md5List) {
  return apiClient.post("/payments/khqr/check-md5-list", md5List, authConfig(token));
}

export async function confirmPaymentKhqrTransaction(token, payload) {
  return apiClient.post("/payments/khqr/confirm-transaction", payload, authConfig(token));
}

export async function fetchBakongTokenStatus(token) {
  const response = await apiClient.get("/payments/bakong-token", authConfig(token));
  return unwrapApiData(response.data);
}

export async function saveBakongToken(token, accessToken) {
  return apiClient.post("/payments/bakong-token", { accessToken }, authConfig(token));
}
