import { apiClient, authConfig, unwrapApiData } from "../apiClient";

/** Latest driver GPS for an order in Ready_For_Delivery (admin/owner/logistics allowed). */
export async function fetchOrderDeliveryLocation(token, orderId) {
  const response = await apiClient.get(
    `/mobile/orders/${orderId}/delivery-location`,
    authConfig(token),
  );
  return unwrapApiData(response.data);
}
