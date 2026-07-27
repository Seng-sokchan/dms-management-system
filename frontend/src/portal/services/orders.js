import { apiClient, authConfig, unwrapApiData } from "../../services/apiClient";

async function resolveCustomerId(token, user) {
  if (user?.customerId != null && String(user.customerId).trim() !== "") {
    return String(user.customerId);
  }

  const res = await apiClient.get("/orders", authConfig(token));
  const orders = unwrapApiData(res.data);
  if (!Array.isArray(orders) || orders.length === 0) return "";
  const firstOrderWithCustomer = orders.find((order) => order?.customerId);
  if (firstOrderWithCustomer?.customerId) return String(firstOrderWithCustomer.customerId);

  const ownOrder = orders.find((order) => String(order?.userId || "") === String(user?.id || ""));
  return ownOrder?.customerId ? String(ownOrder.customerId) : "";
}

export async function preOrderCart(token, user, cartItems) {
  const customerId = await resolveCustomerId(token, user);
  if (!customerId) {
    throw new Error(
      "No customer is linked to this account. Ask an admin to link your user to a customer record.",
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

export async function createDepotBatch(token, lines) {
  const response = await apiClient.post(
    "/orders/depot-batch",
    { lines },
    authConfig(token),
  );
  return unwrapApiData(response.data);
}

export async function fetchPortalItems(token) {
  const response = await apiClient.get("/items", authConfig(token));
  const rows = unwrapApiData(response.data);
  return Array.isArray(rows) ? rows : [];
}

export async function fetchPortalCustomers(token) {
  const response = await apiClient.get("/customers", authConfig(token));
  const rows = unwrapApiData(response.data);
  return Array.isArray(rows) ? rows : [];
}
