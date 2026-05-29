import { apiClient, authConfig, unwrapApiData } from "./apiClient";

/**
 * Fetch customers visible to the current user.
 * For a Depot caller, the backend (`customerService.getAllowedCustomers`) returns
 * only customers whose `depot_id` equals the caller's depot.
 */
export async function fetchCustomers(token) {
  const response = await apiClient.get("/customers", authConfig(token));
  const payload = unwrapApiData(response.data);
  return Array.isArray(payload) ? payload : [];
}
