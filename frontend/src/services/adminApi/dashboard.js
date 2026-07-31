import { apiClient, authConfig, unwrapApiData } from "../apiClient";
import { fetchOrderPaymentTotals } from "./orders";
import { fetchBorrowMaterialOrderLoans } from "./borrowMaterialOrderLoans";
import { fetchBorrowMaterialMonthlySchedules } from "./borrowMaterialMonthlySchedules";
import { fetchCustomerItemPrices } from "./customerItemPrices";
import { fetchDepotItemPrices } from "./depotItemPrices";
import { fetchRoles } from "./rules";
import { hasAdminPanelAccess, hasPortalAccess } from "../../constants/menus";

/**
 * Route-aware dashboard load so each page requests only needed data.
 */
const ROUTE_DATA_MAP = {
  "/overview": ["summary", "statuses"],
  "/catalogs": ["catalogs"],
  "/items": ["catalogs", "items"],
  "/customer-item-prices": ["customers", "items", "customerItemPrices"],
  "/depot-item-prices": ["depots", "items", "depotItemPrices"],
  "/customers": ["customers", "depots", "provinces"],
  "/tracking-customer-location": ["customers"],
  "/provinces": ["provinces"],
  "/depots": ["depots"],
  "/customers-by-depot": ["depots", "customers"],
  "/customer-priority": ["provinces"],
  "/producers": ["producers"],
  "/delivery-agents": ["deliveryAgents"],
  "/users": ["users", "roles", "customers", "deliveryAgents", "depots"],
  "/orders": ["orders", "statuses", "deliveryAgents"],
  "/orders/by-province": ["orders", "deliveryAgents"],
  "/orders/by-depot": ["orders", "customers"],
  "/orders/by-delivery": ["orders", "deliveryAgents"],
  "/assign-orders": ["orders", "deliveryAgents", "customers"],
  "/payments": ["paymentTotals"],
  "/customer-order-history": ["customers", "orders"],
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

function emptyDashboardData(user) {
  return {
    user,
    summary: null,
    statuses: [],
    orders: [],
    customers: [],
    provinces: [],
    depots: [],
    producers: [],
    deliveryAgents: [],
    catalogs: [],
    items: [],
    users: [],
    roles: [],
    borrowMaterials: [],
    customerBorrowedMaterials: [],
    borrowMaterialOrderLoans: [],
    borrowMaterialMonthlySchedules: [],
    paymentTotals: { byCustomer: [], byDepot: [] },
    customerItemPrices: [],
    depotItemPrices: [],
  };
}

export async function fetchDashboardData(token, pathname = "/overview") {
  const config = authConfig(token);
  const profile = await apiClient.get("/users/me", config);
  const user = unwrapApiData(profile.data);

  // Portal / non-admin sessions only need the profile — skip admin data fetches.
  if (hasPortalAccess(user) || !hasAdminPanelAccess(user)) {
    return emptyDashboardData(user);
  }

  const safePathname = pathname;
  const routeKeys = getKeysForRoute(safePathname);
  const requested = new Set(routeKeys);

  requested.add("users");
  requested.add("roles");
  const data = emptyDashboardData(user);

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
  queue("provinces", async () => {
    const res = await apiClient.get("/provinces", config);
    const rows = unwrapApiData(res.data);
    data.provinces = Array.isArray(rows) ? rows : [];
  });
  queue("depots", async () => {
    const res = await apiClient.get("/depots", config);
    const rows = unwrapApiData(res.data);
    data.depots = Array.isArray(rows) ? rows : [];
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
  queue("users", async () => {
    const res = await apiClient.get("/users", config);
    const rows = unwrapApiData(res.data);
    data.users = Array.isArray(rows) ? rows : [];
  });
  queue("roles", async () => {
    const rows = await fetchRoles(token);
    data.roles = Array.isArray(rows) ? rows : [];
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
  queue("depotItemPrices", async () => {
    const res = await fetchDepotItemPrices(token);
    const rows = unwrapApiData(res.data);
    data.depotItemPrices = Array.isArray(rows) ? rows : [];
  });

  await Promise.all(tasks);
  return data;
}
