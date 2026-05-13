import { FALLBACK_CUSTOMER_ID } from "../config/appConfig";
import { apiClient, authConfig, unwrapApiData } from "./apiClient";

async function resolveCustomerId(token, currentUserId) {
  if (FALLBACK_CUSTOMER_ID) return String(FALLBACK_CUSTOMER_ID);

  const res = await apiClient.get("/orders", authConfig(token));
  const orders = unwrapApiData(res.data);
  if (!Array.isArray(orders) || orders.length === 0) return "";
  const firstOrderWithCustomer = orders.find((order) => order?.customerId);
  if (firstOrderWithCustomer?.customerId) return String(firstOrderWithCustomer.customerId);

  // Last fallback for mixed payloads from legacy APIs
  const ownOrder = orders.find((order) => String(order?.userId || "") === String(currentUserId || ""));
  return ownOrder?.customerId ? String(ownOrder.customerId) : "";
}

export async function preOrderCart(token, user, cartItems) {
  const customerId = await resolveCustomerId(token, user?.id);
  if (!customerId) {
    throw new Error("Customer profile not found. Set FALLBACK_CUSTOMER_ID in appConfig.js");
  }

  const lines = cartItems.map((cartItem) => ({
    itemId: String(cartItem.item.id),
    orderedQty: Number(cartItem.quantity),
    currency: "KHR",
  }));

  const response = await apiClient.post(
    "/orders/batch",
    { customerId, lines },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function listMobileOrders(token) {
  const response = await apiClient.get("/mobile/orders", authConfig(token));
  const rows = unwrapApiData(response.data);
  return Array.isArray(rows) ? rows : [];
}

export async function updateMobileOrderStatus(token, orderId, status) {
  const response = await apiClient.post(
    `/mobile/orders/${orderId}/status`,
    { status },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}
