/** Stable keys for sidebar routes; must match frontend `MENU_ITEMS`. */
const MENU_KEYS = [
  "overview",
  "newOrder",
  "catalogs",
  "items",
  "customers",
  "producers",
  "deliveryAgents",
  "trucks",
  "orders",
  "payments",
  "users",
  "activityLogs",
];

const MENU_KEY_SET = new Set(MENU_KEYS);

/** Default menu access (same behavior as the original hardcoded NAV). */
const DEFAULT_MENUS_BY_ROLE = {
  Admin: [
    "overview",
    "newOrder",
    "catalogs",
    "items",
    "customers",
    "producers",
    "deliveryAgents",
    "trucks",
    "orders",
    "payments",
    "users",
    "activityLogs",
  ],
  Owner: [
    "overview",
    "newOrder",
    "catalogs",
    "items",
    "customers",
    "producers",
    "deliveryAgents",
    "trucks",
    "orders",
    "payments",
  ],
  Logistics: ["overview", "deliveryAgents", "trucks", "orders"],
  Delivery: ["overview", "orders"],
  Customer: ["overview", "orders", "payments"],
};

module.exports = {
  MENU_KEYS,
  MENU_KEY_SET,
  DEFAULT_MENUS_BY_ROLE,
};
