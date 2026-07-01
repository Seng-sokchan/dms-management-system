const MOBILE_MENU_ORDER = {
  "mobile.newOrder": 1,
  "mobile.myOrders": 2,
  "mobile.tracking": 3,
  "mobile.profile": 4,
  "mobile.live": 5,
  "mobile.prepareBatch": 6,
  "mobile.depotOrders": 7,
};

export function hasMobileMenu(user, menuKey) {
  const menus = user?.allowedMobileMenus;
  if (!Array.isArray(menus)) return false;
  return menus.includes(menuKey);
}

export function resolveMobileRoot(user) {
  if (hasMobileMenu(user, "mobile.live")) return "DeliveryMain";
  if (hasMobileMenu(user, "mobile.prepareBatch") || hasMobileMenu(user, "mobile.depotOrders")) {
    return "DepotMain";
  }
  return "Main";
}

export function sortMobileMenus(menuKeys = []) {
  return [...menuKeys].sort(
    (a, b) => (MOBILE_MENU_ORDER[a] ?? 999) - (MOBILE_MENU_ORDER[b] ?? 999),
  );
}

export function canSetStatus(user, statusName, action = "update_status") {
  const perms = user?.statusPermissions;
  if (!perms || !perms[statusName]) return false;
  return perms[statusName].includes(action);
}

export function getAllowedNextStatuses(user, currentStatus, transitionsMap = {}) {
  const next = Array.isArray(transitionsMap[currentStatus]) ? transitionsMap[currentStatus] : [];
  return next.filter((statusName) => canSetStatus(user, statusName, "update_status"));
}
