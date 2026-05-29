import { apiClient, authConfig, unwrapApiData } from "./apiClient";

export async function fetchOrderDeliveryLocation(token, orderId) {
  const response = await apiClient.get(
    `/mobile/orders/${orderId}/delivery-location`,
    authConfig(token),
  );
  return unwrapApiData(response.data);
}
