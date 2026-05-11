import { apiClient, authConfig, unwrapApiData } from "../apiClient";
import { fetchOrderPaymentTotals } from "./orders";
import { fetchBorrowMaterialOrderLoans } from "./borrowMaterialOrderLoans";
import { fetchBorrowMaterialMonthlySchedules } from "./borrowMaterialMonthlySchedules";
import { fetchCustomerItemPrices } from "./customerItemPrices";
import { canAccessPath } from "../../constants/menus";

/**
 * Route-aware dashboard load so each page requests only needed data.
 */
const ROUTE_DATA_MAP = {
  "/overview": ["summary", "statuses"],
  "/create-order": ["customers", "customerUsers", "addresses", "producers", "items"],
  "/catalogs": ["catalogs"],
  "/items": ["catalogs", "items"],
  "/customer-item-prices": ["customers", "items", "customerItemPrices"],
  "/addresses": ["addresses"],
  "/customers": ["customers", "customerUsers", "addresses", "depots"],
  "/depots": ["depots"],
  "/customers-by-depot": ["depots", "customers"],
  "/producers": ["producers"],
  "/delivery-agents": ["deliveryAgents"],
  "/users": ["users", "roleMenus"],
  "/orders": ["orders", "statuses", "deliveryAgents"],
  "/order-groups": ["orderGroups"],
  "/assign-orders": ["orders", "deliveryAgents", "orderGroups"],
  "/order-movement": ["orders", "statuses"],
  "/payments": ["paymentTotals"],
  "/borrowed-materials": [
    "customers",
    "borrowMaterials",
    "customerBorrowedMaterials",
    "orders",
    "borrowMaterialOrderLoans",
    "borrowMaterialMonthlySchedules",
  ],
};

function getKeysForRoute(pathname = "/overview") {
  return ROUTE_DATA_MAP[pathname] || ROUTE_DATA_MAP["/overview"];
}

export async function fetchDashboardData(token, pathname = "/overview") {
  const config = authConfig(token);
  const profile = await apiClient.get("/users/me", config);
  const user = unwrapApiData(profile.data);
  const canManageCustomers = user?.role === "Admin" || user?.role === "Owner" || user?.role === "Depot";
  const safePathname = canAccessPath(user, pathname) ? pathname : "/overview";
  const routeKeys = getKeysForRoute(safePathname);
  const requested = new Set(routeKeys);

  if (canAccessPath(user, "/users")) {
    requested.add("users");
    requested.add("roleMenus");
  }
  const data = {
    user,
    summary: null,
    statuses: [],
    orders: [],
    customers: [],
    depots: [],
    customerUsers: [],
    addresses: [],
    producers: [],
    deliveryAgents: [],
    catalogs: [],
    items: [],
    orderGroups: [],
    users: [],
    roleMenusByRole: null,
    borrowMaterials: [],
    customerBorrowedMaterials: [],
    borrowMaterialOrderLoans: [],
    borrowMaterialMonthlySchedules: [],
    paymentTotals: { byCustomer: [], byDepot: [] },
    customerItemPrices: [],
  };

  const tasks = [];
  const queue = (key, run) => {
    if (!requested.has(key)) return;
    tasks.push(run());
  };

  queue("summary", async () => {
    const res = await apiClient.get("/dashboard/summary", config);
    data.summary = unwrapApiData(res.data);
  });
  queue("statuses", async () => {
    const res = await apiClient.get("/statuses", config);
    const rows = unwrapApiData(res.data);
    data.statuses = Array.isArray(rows) ? rows : [];
  });
  queue("orders", async () => {
    const res = await apiClient.get("/orders", config);
    const rows = unwrapApiData(res.data);
    data.orders = Array.isArray(rows) ? rows : [];
  });
  queue("customers", async () => {
    const res = await apiClient.get("/customers", config);
    const rows = unwrapApiData(res.data);
    data.customers = Array.isArray(rows) ? rows : [];
  });
  queue("depots", async () => {
    const res = await apiClient.get("/depots", config);
    const rows = unwrapApiData(res.data);
    data.depots = Array.isArray(rows) ? rows : [];
  });
  queue("customerUsers", async () => {
    if (!canManageCustomers) return;
    const res = await apiClient.get("/customer-users", config);
    const rows = unwrapApiData(res.data);
    data.customerUsers = Array.isArray(rows) ? rows : [];
  });
  queue("addresses", async () => {
    const res = await apiClient.get("/addresses", config);
    const rows = unwrapApiData(res.data);
    data.addresses = Array.isArray(rows) ? rows : [];
  });
  queue("producers", async () => {
    const res = await apiClient.get("/producers", config);
    const rows = unwrapApiData(res.data);
    data.producers = Array.isArray(rows) ? rows : [];
  });
  queue("deliveryAgents", async () => {
    const res = await apiClient.get("/delivery-agents", config);
    const rows = unwrapApiData(res.data);
    data.deliveryAgents = Array.isArray(rows) ? rows : [];
  });
  queue("catalogs", async () => {
    const res = await apiClient.get("/catalogs", config);
    const rows = unwrapApiData(res.data);
    data.catalogs = Array.isArray(rows) ? rows : [];
  });
  queue("items", async () => {
    const res = await apiClient.get("/items", config);
    const rows = unwrapApiData(res.data);
    data.items = Array.isArray(rows) ? rows : [];
  });
  queue("orderGroups", async () => {
    const res = await apiClient.get("/order-groups", config);
    const rows = unwrapApiData(res.data);
    data.orderGroups = Array.isArray(rows) ? rows : [];
  });
  queue("users", async () => {
    const res = await apiClient.get("/users", config);
    const rows = unwrapApiData(res.data);
    data.users = Array.isArray(rows) ? rows : [];
  });
  queue("roleMenus", async () => {
    const res = await apiClient.get("/role-menus", config);
    const payload = unwrapApiData(res.data);
    data.roleMenusByRole = payload && typeof payload === "object" ? payload : null;
  });
  queue("borrowMaterials", async () => {
    const res = await apiClient.get("/borrow-materials", config);
    const rows = unwrapApiData(res.data);
    data.borrowMaterials = Array.isArray(rows) ? rows : [];
  });
  queue("customerBorrowedMaterials", async () => {
    const res = await apiClient.get("/customer-borrowed-materials", config);
    const rows = unwrapApiData(res.data);
    data.customerBorrowedMaterials = Array.isArray(rows) ? rows : [];
  });
  queue("borrowMaterialOrderLoans", async () => {
    const res = await fetchBorrowMaterialOrderLoans(token);
    const rows = unwrapApiData(res.data);
    data.borrowMaterialOrderLoans = Array.isArray(rows) ? rows : [];
  });
  queue("borrowMaterialMonthlySchedules", async () => {
    const res = await fetchBorrowMaterialMonthlySchedules(token);
    const rows = unwrapApiData(res.data);
    data.borrowMaterialMonthlySchedules = Array.isArray(rows) ? rows : [];
  });
  queue("paymentTotals", async () => {
    data.paymentTotals = await fetchOrderPaymentTotals(token);
  });
  queue("customerItemPrices", async () => {
    const res = await fetchCustomerItemPrices(token);
    const rows = unwrapApiData(res.data);
    data.customerItemPrices = Array.isArray(rows) ? rows : [];
  });

  await Promise.all(tasks);
  return data;
}
