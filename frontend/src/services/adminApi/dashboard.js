import { apiClient, authConfig } from "../apiClient";

/**
 * Initial dashboard load: overview + shared lists used across menus (home / first paint).
 */
export async function fetchDashboardData(token) {
  const config = authConfig(token);
  const profile = await apiClient.get("/users/me", config);
  const canManageCustomers = profile.data?.role === "Admin" || profile.data?.role === "Owner";
  const [
    summaryRes,
    statusesRes,
    ordersRes,
    customersRes,
    customerUsersRes,
    addressesRes,
    producersRes,
    deliveryRes,
    trucksRes,
    paymentsRes,
    paymentMethodsRes,
    catalogsRes,
    itemsRes,
    orderGroupsRes,
  ] =
    await Promise.all([
      apiClient.get("/dashboard/summary", config),
      apiClient.get("/statuses", config),
      apiClient.get("/orders", config),
      apiClient.get("/customers", config),
      canManageCustomers ? apiClient.get("/customer-users", config) : Promise.resolve({ data: [] }),
      apiClient.get("/addresses", config),
      apiClient.get("/producers", config),
      apiClient.get("/delivery-agents", config),
      apiClient.get("/trucks", config),
      apiClient.get("/payments", config),
      apiClient.get("/payment-methods", config),
      apiClient.get("/catalogs", config),
      apiClient.get("/items", config),
      apiClient.get("/order-groups", config),
    ]);

  return {
    user: profile.data,
    summary: summaryRes.data,
    statuses: statusesRes.data,
    orders: ordersRes.data,
    customers: customersRes.data,
    customerUsers: customerUsersRes.data,
    addresses: addressesRes.data,
    producers: producersRes.data,
    deliveryAgents: deliveryRes.data,
    trucks: trucksRes.data,
    payments: paymentsRes.data,
    paymentMethods: paymentMethodsRes.data,
    catalogs: catalogsRes.data,
    items: itemsRes.data,
    orderGroups: orderGroupsRes.data,
  };
}
