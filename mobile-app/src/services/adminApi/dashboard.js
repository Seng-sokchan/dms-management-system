import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchDashboardSummary(token) {
  const res = await apiClient.get("/dashboard/summary", authConfig(token));
  return unwrapApiData(res.data);
}

export async function fetchStatuses(token) {
  const res = await apiClient.get("/statuses", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}
