import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchActivityLogs(token, limit = 5000) {
  const response = await apiClient.get(`/activity-logs?limit=${Number(limit) || 5000}`, authConfig(token));
  return unwrapApiData(response.data);
}
