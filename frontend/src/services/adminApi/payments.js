import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchUnpaidMasterOrders(token) {
  const res = await apiClient.get("/payments/unpaid-orders", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function createManualPayment(token, payload) {
  const res = await apiClient.post("/payments/manual", payload, authConfig(token));
  return unwrapApiData(res.data);
}
