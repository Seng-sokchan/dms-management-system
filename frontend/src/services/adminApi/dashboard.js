import { apiClient, authConfig, unwrapApiData } from "../apiClient";
import { fetchOrderPaymentTotals } from "./orders";
import { fetchBorrowMaterialOrderLoans } from "./borrowMaterialOrderLoans";
import { fetchBorrowMaterialMonthlySchedules } from "./borrowMaterialMonthlySchedules";
import { fetchCustomerItemPrices } from "./customerItemPrices";
import { fetchDepotItemPrices } from "./depotItemPrices";
import { fetchRoles, fetchMenus, fetchStatusTransitions, fetchRoleAccess, fetchRoleStatusPermissions } from "./rules";
import { canAccessPath } from "../../constants/menus";

/**
 * Route-aware dashboard load so each page requests only needed data.
 */
const ROUTE_DATA_MAP = {
  "/overview": ["summary", "statuses"],
  "/create-order": ["customers", "producers", "items"],
  "/catalogs": ["catalogs"],
  "/items": ["catalogs", "items"],
  "/customer-item-prices": ["customers", "items", "depots", "customerItemPrices", "depotItemPrices"],
  "/customers": ["customers", "depots", "provinces"],
  "/tracking-customer-location": ["customers"],
  "/provinces": ["provinces"],
  "/depots": ["depots"],
  "/customers-by-depot": ["depots", "customers"],
  "/producers": ["producers"],
  "/delivery-agents": ["deliveryAgents"],
  "/users": ["users", "roleMenus", "roles", "menus", "mobileMenus", "statusTransitions", "roleAccess", "roleStatusPermissions", "statuses", "customers", "deliveryAgents"],
  "/orders": ["orders", "statuses", "deliveryAgents"],
  "/assign-orders": ["orders", "deliveryAgents"],
  "/order-movement": ["orders", "statuses"],
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

export async function fetchDashboardData(token, pathname = "/overview") {
  const config = authConfig(token);
  const profile = await apiClient.get("/users/me", config);
  const user = unwrapApiData(profile.data);
  const safePathname = canAccessPath(user, pathname) ? pathname : "/overview";
  const routeKeys = getKeysForRoute(safePathname);
  const requested = new Set(routeKeys);

  if (canAccessPath(user, "/users")) {
    requested.add("users");
    requested.add("roleMenus");
    requested.add("roles");
    requested.add("menus");
    requested.add("mobileMenus");
    requested.add("statusTransitions");
    requested.add("roleAccess");
    requested.add("roleStatusPermissions");
    requested.add("statuses");
  }
  const data = {
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
    roleMenusByRole: null,
    roles: [],
    menuCatalog: [],
    mobileMenuCatalog: [],
    statusTransitionsByStatus: null,
    roleAccessByRole: null,
    roleStatusPermissionsByRole: null,
    borrowMaterials: [],
    customerBorrowedMaterials: [],
    borrowMaterialOrderLoans: [],
    borrowMaterialMonthlySchedules: [],
    paymentTotals: { byCustomer: [], byDepot: [] },
    customerItemPrices: [],
    depotItemPrices: [],
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
  queue("roleMenus", async () => {
    const res = await apiClient.get("/role-menus", config);
    const payload = unwrapApiData(res.data);
    data.roleMenusByRole = payload && typeof payload === "object" ? payload : null;
  });
  queue("roles", async () => {
    const rows = await fetchRoles(token);
    data.roles = Array.isArray(rows) ? rows : [];
  });
  queue("menus", async () => {
    const rows = await fetchMenus(token, { client: "admin" });
    data.menuCatalog = Array.isArray(rows) ? rows : [];
  });
  queue("mobileMenus", async () => {
    const rows = await fetchMenus(token, { client: "mobile" });
    data.mobileMenuCatalog = Array.isArray(rows) ? rows : [];
  });
  queue("statusTransitions", async () => {
    const payload = await fetchStatusTransitions(token);
    data.statusTransitionsByStatus = payload && typeof payload === "object" ? payload : null;
  });
  queue("roleAccess", async () => {
    const rows = await fetchRoleAccess(token);
    if (Array.isArray(rows)) {
      data.roleAccessByRole = Object.fromEntries(rows.map((row) => [row.roleName, row]));
    }
  });
  queue("roleStatusPermissions", async () => {
    const payload = await fetchRoleStatusPermissions(token);
    data.roleStatusPermissionsByRole = payload && typeof payload === "object" ? payload : null;
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
