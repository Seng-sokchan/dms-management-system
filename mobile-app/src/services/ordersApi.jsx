import { FALLBACK_CUSTOMER_ID } from "../config/appConfig";
import { apiClient, authConfig, unwrapApiData } from "./apiClient";

async function resolveCustomerId(token, user) {
  if (FALLBACK_CUSTOMER_ID) return String(FALLBACK_CUSTOMER_ID);
  if (user?.customerId != null && String(user.customerId).trim() !== "") {
    return String(user.customerId);
  }

  const res = await apiClient.get("/orders", authConfig(token));
  const orders = unwrapApiData(res.data);
  if (!Array.isArray(orders) || orders.length === 0) return "";
  const firstOrderWithCustomer = orders.find((order) => order?.customerId);
  if (firstOrderWithCustomer?.customerId) return String(firstOrderWithCustomer.customerId);

  // Last fallback for mixed payloads from legacy APIs
  const ownOrder = orders.find((order) => String(order?.userId || "") === String(user?.id || ""));
  return ownOrder?.customerId ? String(ownOrder.customerId) : "";
}

export async function preOrderCart(token, user, cartItems) {
  const customerId = await resolveCustomerId(token, user);
  if (!customerId) {
    throw new Error(
      "No customer is linked to this account (or no prior orders to infer from). "
        + "Ask an admin to link your user to a customer record, or set FALLBACK_CUSTOMER_ID in appConfig.js for development.",
    );
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

export async function confirmMobileDelivery(token, orderId, { lossQty }) {
  const response = await apiClient.post(
    `/mobile/orders/${orderId}/delivery-confirmation`,
    { lossQty },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

/**
 * Submit a multi-customer batch of orders. Each line targets a single customer
 * and item with a quantity. Used by the Depot mobile flow.
 *
 * @param {string} token - access token
 * @param {Array<{customerId: string, itemId: string, orderedQty: number, currency?: string, unitPrice?: number}>} lines
 */
export async function createDepotBatch(token, lines) {
  const response = await apiClient.post(
    "/orders/depot-batch",
    { lines },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}
