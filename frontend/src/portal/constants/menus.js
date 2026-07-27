/** Matches mobile Customer primary tabs (cart is nested, not a tab). */
export const CUSTOMER_PORTAL_MENU = [
  { key: "order", path: "/portal/items", labelKey: "portal.nav.order", icon: "store" },
  { key: "orders", path: "/portal/orders", labelKey: "portal.nav.orders", icon: "receipt" },
  { key: "profile", path: "/portal/profile", labelKey: "portal.nav.profile", icon: "account" },
];

/** Matches mobile Depot primary tabs (batch cart is nested, not a tab). */
export const DEPOT_PORTAL_MENU = [
  { key: "prepare", path: "/portal/prepare-batch", labelKey: "portal.nav.prepare", icon: "clipboard" },
  { key: "orders", path: "/portal/depot-orders", labelKey: "portal.nav.orders", icon: "package" },
  { key: "profile", path: "/portal/profile", labelKey: "portal.nav.profile", icon: "account" },
];

/** Routes where the floating tab bar is hidden (like mobile stack screens). */
export const PORTAL_HIDE_TAB_BAR_PREFIXES = [
  "/portal/cart",
  "/portal/depot-cart",
  "/portal/pay/",
  "/portal/pay-batch/",
  "/portal/payment-result/",
];

export function portalHomePath(user) {
  if (user?.role === "Depot") return "/portal/prepare-batch";
  return "/portal/items";
}

export function shouldHidePortalTabBar(pathname) {
  return PORTAL_HIDE_TAB_BAR_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
