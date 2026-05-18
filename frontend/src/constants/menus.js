/**
 * Menu keys and paths (aligned with backend `roleMenus` and i18n `nav.*` / `page.*`).
 */
export const MENU_ITEMS = [
  { key: "overview", path: "/overview", labelKey: "nav.overview", subKey: "nav.overviewSub" },
  { key: "newOrder", path: "/create-order", labelKey: "nav.newOrder", subKey: "nav.newOrderSub" },
  { key: "catalogs", path: "/catalogs", labelKey: "nav.catalogs", subKey: "nav.catalogsSub" },
  { key: "items", path: "/items", labelKey: "nav.items", subKey: "nav.itemsSub" },
  { key: "customerItemPrices", path: "/customer-item-prices", labelKey: "nav.customerItemPrices", subKey: "nav.customerItemPricesSub" },
  { key: "customers", path: "/customers", labelKey: "nav.customers", subKey: "nav.customersSub" },
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
  { key: "orderGroups", path: "/order-groups", labelKey: "nav.orderGroups", subKey: "nav.orderGroupsSub" },
  { key: "assignOrders", path: "/assign-orders", labelKey: "nav.assignOrders", subKey: "nav.assignOrdersSub" },
  { key: "orderMovement", path: "/order-movement", labelKey: "nav.orderMovement", subKey: "nav.orderMovementSub" },
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

/**
 * @param {string} pathname
 * @returns {string|undefined}
 */
export function menuKeyForPathname(pathname) {
  return PATH_TO_MENU_KEY[pathname];
}

/**
 * @param {{ role?: string, allowedMenus?: string[] }|null|undefined} user
 * @param {string} menuKey
 */
export function canAccessMenuKey(user, menuKey) {
  if (!menuKey) return false;
  if (!user) return false;
  if (user.role === "Admin") return true;
  if (menuKey === "users") return false;

  const allowed = user.allowedMenus;
  if (!Array.isArray(allowed) || allowed.length === 0) return false;

  if (menuKey === "orderMovement") {
    return allowed.includes("orderMovement") || allowed.includes("orders");
  }
  return allowed.includes(menuKey);
}

/**
 * @param {{ allowedMenus?: string[] }|null|undefined} user
 * @param {string} pathname
 */
export function canAccessPath(user, pathname) {
  const key = menuKeyForPathname(pathname);
  if (!key) return true;
  return canAccessMenuKey(user, key);
}

export const ALL_MENU_KEYS = MENU_ITEMS.map((i) => i.key);
