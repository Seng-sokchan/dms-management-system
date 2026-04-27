import { apiClient, authConfig } from "../apiClient";

export async function fetchActivityLogs(token, limit = 300) {
  const response = await apiClient.get(`/activity-logs?limit=${Number(limit) || 300}`, authConfig(token));
  return response.data;
}
