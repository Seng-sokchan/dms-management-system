import { apiClient, authConfig } from "../apiClient";

/**
 * Route-aware dashboard load so each page requests only needed data.
 */
const ROUTE_DATA_MAP = {
  "/overview": ["summary", "statuses"],
  "/create-order": ["customers", "customerUsers", "addresses", "producers", "trucks", "items"],
  "/catalogs": ["catalogs"],
  "/items": ["catalogs", "items"],
  "/customers": ["customers", "customerUsers", "addresses"],
  "/producers": ["producers"],
  "/delivery-agents": ["deliveryAgents"],
  "/trucks": ["trucks", "deliveryAgents"],
  "/users": ["users", "roleMenus"],
  "/activity-logs": ["activityLogs"],
  "/orders": ["orders", "statuses"],
  "/customer-orders": ["orders"],
  "/owner-preparing": ["orders", "orderGroups"],
  "/confirm-orders": ["orders", "statuses"],
  "/payments": ["orders", "payments", "paymentMethods"],
};

function getKeysForRoute(pathname = "/overview") {
  return ROUTE_DATA_MAP[pathname] || ROUTE_DATA_MAP["/overview"];
}

export async function fetchDashboardData(token, pathname = "/overview") {
  const config = authConfig(token);
  const profile = await apiClient.get("/users/me", config);
  const user = profile.data;
  const canManageCustomers = profile.data?.role === "Admin" || profile.data?.role === "Owner";
  const routeKeys = getKeysForRoute(pathname);
  const requested = new Set(routeKeys);

  if (user?.role === "Admin" && user?.allowedMenus?.includes("users")) {
    requested.add("users");
    requested.add("roleMenus");
  }
  if (user?.role === "Admin" && user?.allowedMenus?.includes("activityLogs")) {
    requested.add("activityLogs");
  }

  const data = {
    user,
    summary: null,
    statuses: [],
    orders: [],
    customers: [],
    customerUsers: [],
    addresses: [],
    producers: [],
    deliveryAgents: [],
    trucks: [],
    payments: [],
    paymentMethods: [],
    catalogs: [],
    items: [],
    orderGroups: [],
    users: [],
    roleMenusByRole: null,
    activityLogs: [],
  };

  const tasks = [];
  const queue = (key, run) => {
    if (!requested.has(key)) return;
    tasks.push(run());
  };

  queue("summary", async () => {
    const res = await apiClient.get("/dashboard/summary", config);
    data.summary = res.data;
  });
  queue("statuses", async () => {
    const res = await apiClient.get("/statuses", config);
    data.statuses = Array.isArray(res.data) ? res.data : [];
  });
  queue("orders", async () => {
    const res = await apiClient.get("/orders", config);
    data.orders = Array.isArray(res.data) ? res.data : [];
  });
  queue("customers", async () => {
    const res = await apiClient.get("/customers", config);
    data.customers = Array.isArray(res.data) ? res.data : [];
  });
  queue("customerUsers", async () => {
    if (!canManageCustomers) return;
    const res = await apiClient.get("/customer-users", config);
    data.customerUsers = Array.isArray(res.data) ? res.data : [];
  });
  queue("addresses", async () => {
    const res = await apiClient.get("/addresses", config);
    data.addresses = Array.isArray(res.data) ? res.data : [];
  });
  queue("producers", async () => {
    const res = await apiClient.get("/producers", config);
    data.producers = Array.isArray(res.data) ? res.data : [];
  });
  queue("deliveryAgents", async () => {
    const res = await apiClient.get("/delivery-agents", config);
    data.deliveryAgents = Array.isArray(res.data) ? res.data : [];
  });
  queue("trucks", async () => {
    const res = await apiClient.get("/trucks", config);
    data.trucks = Array.isArray(res.data) ? res.data : [];
  });
  queue("payments", async () => {
    const res = await apiClient.get("/payments", config);
    data.payments = Array.isArray(res.data) ? res.data : [];
  });
  queue("paymentMethods", async () => {
    const res = await apiClient.get("/payment-methods", config);
    data.paymentMethods = Array.isArray(res.data) ? res.data : [];
  });
  queue("catalogs", async () => {
    const res = await apiClient.get("/catalogs", config);
    data.catalogs = Array.isArray(res.data) ? res.data : [];
  });
  queue("items", async () => {
    const res = await apiClient.get("/items", config);
    data.items = Array.isArray(res.data) ? res.data : [];
  });
  queue("orderGroups", async () => {
    const res = await apiClient.get("/order-groups", config);
    data.orderGroups = Array.isArray(res.data) ? res.data : [];
  });
  queue("users", async () => {
    const res = await apiClient.get("/users", config);
    data.users = Array.isArray(res.data) ? res.data : [];
  });
  queue("roleMenus", async () => {
    const res = await apiClient.get("/role-menus", config);
    data.roleMenusByRole = res.data && typeof res.data === "object" ? res.data : null;
  });
  queue("activityLogs", async () => {
    const res = await apiClient.get("/activity-logs?limit=5000", config);
    data.activityLogs = Array.isArray(res.data) ? res.data : [];
  });

  await Promise.all(tasks);
  return data;
}
