import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchSpecialDaySettings(token) {
  const response = await apiClient.get("/app-settings/special-day", authConfig(token));
  return unwrapApiData(response.data);
}

export async function updateSpecialDaySettings(token, { enabled }) {
  const response = await apiClient.put(
    "/app-settings/special-day",
    { enabled: Boolean(enabled) },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}
