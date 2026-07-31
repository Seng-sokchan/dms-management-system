/**
 * Admin sidebar menu keys and paths (aligned with i18n `nav.*` / `page.*`).
 * Panel access is role-based: Admin and Owner only (see `hasAdminPanelAccess`).
 * Customer/Depot use the temporary web portal (see `hasPortalAccess`).
 */
export const ADMIN_PANEL_ROLES = ["Admin", "Owner"];
export const PORTAL_ROLES = ["Customer", "Depot"];

export const MENU_ITEMS = [
  { key: "overview", path: "/overview", labelKey: "nav.overview", subKey: "nav.overviewSub" },
  {
    key: "adminManagement",
    path: "/catalogs",
    labelKey: "nav.adminManagement",
    subKey: "nav.adminManagementSub",
    children: [
      { key: "catalogs", path: "/catalogs", labelKey: "nav.catalogs", subKey: "nav.catalogsSub" },
      { key: "items", path: "/items", labelKey: "nav.items", subKey: "nav.itemsSub" },
      { key: "provinces", path: "/provinces", labelKey: "nav.provinces", subKey: "nav.provincesSub" },
      { key: "producers", path: "/producers", labelKey: "nav.producers", subKey: "nav.producersSub" },
      { key: "deliveryAgents", path: "/delivery-agents", labelKey: "nav.delivery", subKey: "nav.deliverySub" },
      {
        key: "trackingCustomerLocation",
        path: "/tracking-customer-location",
        labelKey: "nav.trackingCustomerLocation",
        subKey: "nav.trackingCustomerLocationSub",
      },
    ],
  },
  {
    key: "userInformation",
    path: "/customers",
    labelKey: "nav.userInformation",
    subKey: "nav.userInformationSub",
    children: [
      { key: "customers", path: "/customers", labelKey: "nav.customers", subKey: "nav.customersSub" },
      { key: "depots", path: "/depots", labelKey: "nav.depots", subKey: "nav.depotsSub" },
      {
        key: "customerItemPrices",
        path: "/customer-item-prices",
        labelKey: "nav.customerItemPrices",
        subKey: "nav.customerItemPricesSub",
      },
      {
        key: "depotItemPrices",
        path: "/depot-item-prices",
        labelKey: "nav.depotItemPrices",
        subKey: "nav.depotItemPricesSub",
      },
      {
        key: "borrowedMaterials",
        path: "/borrowed-materials",
        labelKey: "nav.borrowedMaterials",
        subKey: "nav.borrowedMaterialsSub",
      },
      {
        key: "customersByDepot",
        path: "/customers-by-depot",
        labelKey: "nav.customersByDepot",
        subKey: "nav.customersByDepotSub",
      },
      {
        key: "customerPriority",
        path: "/customer-priority",
        labelKey: "nav.customerPriority",
        subKey: "nav.customerPrioritySub",
      },
    ],
  },
  {
    key: "orders",
    path: "/orders",
    labelKey: "nav.orders",
    subKey: "nav.ordersSub",
    children: [
      { key: "ordersAll", path: "/orders", labelKey: "nav.ordersAll", subKey: "nav.ordersAllSub" },
      {
        key: "ordersByProvince",
        path: "/orders/by-province",
        labelKey: "nav.ordersByProvince",
        subKey: "nav.ordersByProvinceSub",
      },
      {
        key: "ordersByDepot",
        path: "/orders/by-depot",
        labelKey: "nav.ordersByDepot",
        subKey: "nav.ordersByDepotSub",
      },
      {
        key: "ordersByDelivery",
        path: "/orders/by-delivery",
        labelKey: "nav.ordersByDelivery",
        subKey: "nav.ordersByDeliverySub",
      },
    ],
  },
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
  if (Array.isArray(item.children) && item.children.length > 0) {
    for (const child of item.children) {
      acc[child.path] = child.key;
    }
    if (!acc[item.path]) {
      acc[item.path] = item.key;
    }
  } else {
    acc[item.path] = item.key;
  }
  return acc;
}, {});

export function menuKeyForPathname(pathname) {
  return PATH_TO_MENU_KEY[pathname];
}

/** True when pathname is this parent or one of its children. */
export function isMenuItemActive(item, pathname) {
  if (!item || !pathname) return false;
  if (Array.isArray(item.children) && item.children.length > 0) {
    return item.children.some((child) => child.path === pathname);
  }
  return item.path === pathname;
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

export function canManageMenuKey(user) {
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

export const ALL_MENU_KEYS = MENU_ITEMS.flatMap((item) =>
  Array.isArray(item.children) && item.children.length > 0
    ? [item.key, ...item.children.map((child) => child.key)]
    : [item.key],
);
