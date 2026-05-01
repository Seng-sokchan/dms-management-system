/**
 * Menu keys and paths (aligned with backend `roleMenus` and i18n `nav.*` / `page.*`).
 */
export const MENU_ITEMS = [
  { key: "overview", path: "/overview", labelKey: "nav.overview", subKey: "nav.overviewSub" },
  { key: "newOrder", path: "/create-order", labelKey: "nav.newOrder", subKey: "nav.newOrderSub" },
  { key: "catalogs", path: "/catalogs", labelKey: "nav.catalogs", subKey: "nav.catalogsSub" },
  { key: "items", path: "/items", labelKey: "nav.items", subKey: "nav.itemsSub" },
  { key: "customers", path: "/customers", labelKey: "nav.customers", subKey: "nav.customersSub" },
  { key: "producers", path: "/producers", labelKey: "nav.producers", subKey: "nav.producersSub" },
  { key: "deliveryAgents", path: "/delivery-agents", labelKey: "nav.delivery", subKey: "nav.deliverySub" },
  { key: "trucks", path: "/trucks", labelKey: "nav.trucks", subKey: "nav.trucksSub" },
  { key: "orders", path: "/orders", labelKey: "nav.orders", subKey: "nav.ordersSub" },
  { key: "orderMovement", path: "/order-movement", labelKey: "nav.orderMovement", subKey: "nav.orderMovementSub" },
  { key: "payments", path: "/payments", labelKey: "nav.payments", subKey: "nav.paymentsSub" },
  { key: "users", path: "/users", labelKey: "nav.users", subKey: "nav.usersSub" },
  { key: "activityLogs", path: "/activity-logs", labelKey: "nav.activityLogs", subKey: "nav.activityLogsSub" },
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
 * @param {{ allowedMenus?: string[] }|null|undefined} user
 * @param {string} pathname
 */
export function canAccessPath(user, pathname) {
  if (user?.role === "Admin") {
    return true;
  }
  const key = menuKeyForPathname(pathname);
  if (!key) return true;
  const m = user?.allowedMenus;
  if (m == null) return true;
  if (m.length === 0) return false;
  if (key === "orderMovement") return m.includes("orderMovement") || m.includes("orders");
  return m.includes(key);
}

export const ALL_MENU_KEYS = MENU_ITEMS.map((i) => i.key);
