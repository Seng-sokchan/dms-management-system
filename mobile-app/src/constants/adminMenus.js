/**
 * Admin grid tiles aligned with web MENU_ITEMS.
 * Owner cannot see `users` (matches backend ROLE_ADMIN_MENUS).
 */
export const ADMIN_PANEL_ROLES = ["Admin", "Owner"];

export const ADMIN_MENU_TILES = [
  { key: "overview", icon: "view-dashboard-outline", route: "AdminOverview" },
  { key: "catalogs", icon: "bookshelf", route: "AdminCatalogs" },
  { key: "items", icon: "cube-outline", route: "AdminItems" },
  { key: "customerItemPrices", icon: "currency-usd", route: "AdminCustomerPrices" },
  { key: "depotItemPrices", icon: "home-currency-usd", route: "AdminDepotPrices" },
  { key: "customers", icon: "account-group-outline", route: "AdminCustomers" },
  { key: "provinces", icon: "map-marker-outline", route: "AdminProvinces" },
  { key: "trackingCustomerLocation", icon: "crosshairs-gps", route: "AdminTracking" },
  { key: "borrowedMaterials", icon: "clipboard-text-outline", route: "AdminBorrowedMaterials" },
  { key: "depots", icon: "warehouse", route: "AdminDepots" },
  { key: "customersByDepot", icon: "home-account", route: "AdminCustomersByDepot" },
  { key: "producers", icon: "factory", route: "AdminProducers" },
  { key: "deliveryAgents", icon: "truck-delivery-outline", route: "AdminDeliveryAgents" },
  { key: "orders", icon: "clipboard-list-outline", route: "AdminOrders" },
  { key: "assignOrders", icon: "account-arrow-right-outline", route: "AdminAssignOrders" },
  { key: "specialDay", icon: "calendar-star", route: "AdminSpecialDay" },
  { key: "payments", icon: "credit-card-outline", route: "AdminPayments" },
  { key: "customerOrderHistory", icon: "history", route: "AdminCustomerOrderHistory" },
  { key: "users", icon: "account-cog-outline", route: "AdminUsers", adminOnly: true },
];

export function hasAdminPanelAccess(user) {
  if (!user) return false;
  return ADMIN_PANEL_ROLES.includes(user.role);
}

export function getAdminMenuTilesForUser(user) {
  if (!hasAdminPanelAccess(user)) return [];
  return ADMIN_MENU_TILES.filter((tile) => {
    if (tile.adminOnly && user.role !== "Admin") return false;
    return true;
  });
}
