/** Stable keys for sidebar routes; must match frontend `MENU_ITEMS`. */
const MENU_KEYS = [
  "overview",
  "newOrder",
  "catalogs",
  "items",
  "addresses",
  "customers",
  "depots",
  "producers",
  "deliveryAgents",
  "trucks",
  "orders",
  "orderGroups",
  "assignOrders",
  "orderMovement",
  "payments",
  "users",
  "borrowedMaterials",
];

const MENU_KEY_SET = new Set(MENU_KEYS);

/** Default menu access (same behavior as the original hardcoded NAV). */
const DEFAULT_MENUS_BY_ROLE = {
  Admin: [
    "overview",
    "newOrder",
    "catalogs",
    "items",
    "addresses",
    "customers",
    "depots",
    "producers",
    "deliveryAgents",
    "trucks",
    "orders",
    "orderGroups",
    "assignOrders",
    "orderMovement",
    "payments",
    "users",
    "borrowedMaterials",
  ],
  Owner: [
    "overview",
    "newOrder",
    "catalogs",
    "items",
    "addresses",
    "customers",
    "depots",
    "producers",
    "deliveryAgents",
    "trucks",
    "orders",
    "orderGroups",
    "assignOrders",
    "orderMovement",
    "payments",
    "borrowedMaterials",
  ],
  Logistics: ["overview", "deliveryAgents", "trucks", "orders"],
  Delivery: ["overview", "orders"],
  Customer: ["overview", "orders"],
  Depot: ["overview", "addresses", "customers", "orders", "payments", "borrowedMaterials"],
};

module.exports = {
  MENU_KEYS,
  MENU_KEY_SET,
  DEFAULT_MENUS_BY_ROLE,
};
