/**
 * Admin sidebar menu keys and paths (aligned with i18n `nav.*` / `page.*`).
 * Panel access is role-based: Admin and Owner only (see `hasAdminPanelAccess`).
 * Customer/Depot use the temporary web portal (see `hasPortalAccess`).
 */
export const ADMIN_PANEL_ROLES = ["Admin", "Owner"];
export const PORTAL_ROLES = ["Customer", "Depot"];

export const MENU_ITEMS = [
  { key: "overview", path: "/overview", labelKey: "nav.overview", subKey: "nav.overviewSub" },
  { key: "catalogs", path: "/catalogs", labelKey: "nav.catalogs", subKey: "nav.catalogsSub" },
  { key: "items", path: "/items", labelKey: "nav.items", subKey: "nav.itemsSub" },
  { key: "customerItemPrices", path: "/customer-item-prices", labelKey: "nav.customerItemPrices", subKey: "nav.customerItemPricesSub" },
  { key: "depotItemPrices", path: "/depot-item-prices", labelKey: "nav.depotItemPrices", subKey: "nav.depotItemPricesSub" },
  { key: "customers", path: "/customers", labelKey: "nav.customers", subKey: "nav.customersSub" },
  { key: "provinces", path: "/provinces", labelKey: "nav.provinces", subKey: "nav.provincesSub" },
  {
    key: "trackingCustomerLocation",
    path: "/tracking-customer-location",
    labelKey: "nav.trackingCustomerLocation",
    subKey: "nav.trackingCustomerLocationSub",
  },
  { key: "borrowedMaterials", path: "/borrowed-materials", labelKey: "nav.borrowedMaterials", subKey: "nav.borrowedMaterialsSub" },
  { key: "depots", path: "/depots", labelKey: "nav.depots", subKey: "nav.depotsSub" },
  {
    key: "customersByDepot",
    path: "/customers-by-depot",
    labelKey: "nav.customersByDepot",
    subKey: "nav.customersByDepotSub",
  },
  { key: "producers", path: "/producers", labelKey: "nav.producers", subKey: "nav.producersSub" },
  { key: "deliveryAgents", path: "/delivery-agents", labelKey: "nav.delivery", subKey: "nav.deliverySub" },
  { key: "orders", path: "/orders", labelKey: "nav.orders", subKey: "nav.ordersSub" },
  { key: "assignOrders", path: "/assign-orders", labelKey: "nav.assignOrders", subKey: "nav.assignOrdersSub" },
  { key: "specialDay", path: "/special-day", labelKey: "nav.specialDay", subKey: "nav.specialDaySub" },
  { key: "payments", path: "/payments", labelKey: "nav.payments", subKey: "nav.paymentsSub" },
  {
    key: "customerOrderHistory",
    path: "/customer-order-history",
    labelKey: "nav.customerOrderHistory",
    subKey: "nav.customerOrderHistorySub",
  },
  { key: "users", path: "/users", labelKey: "nav.users", subKey: "nav.usersSub" },
];

const PATH_TO_MENU_KEY = MENU_ITEMS.reduce((acc, item) => {
  acc[item.path] = item.key;
  return acc;
}, {});

export function menuKeyForPathname(pathname) {
  return PATH_TO_MENU_KEY[pathname];
}

export function hasAdminPanelAccess(user) {
  if (!user) return false;
  return ADMIN_PANEL_ROLES.includes(user.role);
}

export function hasPortalAccess(user) {
  if (!user) return false;
  return PORTAL_ROLES.includes(user.role);
}

/** @deprecated use hasAdminPanelAccess */
export function hasAdminClientAccess(user) {
  return hasAdminPanelAccess(user);
}

export function canAccessMenuKey(user, menuKey) {
  if (!menuKey || !user) return false;
  return hasAdminPanelAccess(user);
}

export function canManageMenuKey(user, _menuKey) {
  return hasAdminPanelAccess(user);
}

export function canAccessPath(user, pathname) {
  if (hasPortalAccess(user)) {
    return typeof pathname === "string" && pathname.startsWith("/portal");
  }
  const key = menuKeyForPathname(pathname);
  if (!key) return hasAdminPanelAccess(user);
  return canAccessMenuKey(user, key);
}

export const ALL_MENU_KEYS = MENU_ITEMS.map((i) => i.key);
