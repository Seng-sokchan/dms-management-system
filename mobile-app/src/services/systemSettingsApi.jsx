import { apiClient, authConfig, unwrapApiData } from "./apiClient";

export async function fetchSpecialDaySettings(token) {
  const response = await apiClient.get("/app-settings/special-day", authConfig(token));
  return unwrapApiData(response.data);
}
