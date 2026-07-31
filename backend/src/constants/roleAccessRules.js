/** Fixed role / access rules (no longer stored in DB). */

const ROLE_NAMES = ["Admin", "Owner", "Logistics", "Delivery", "Customer", "Depot"];

const ROLE_DATA_SCOPE = {
  Admin: "all",
  Owner: "owner",
  Logistics: "none",
  Delivery: "delivery_agent",
  Customer: "customer",
  Depot: "depot",
};

const ROLE_CLIENTS = {
  Admin: ["admin", "mobile"],
  Owner: ["admin", "mobile"],
  Logistics: [],
  Delivery: ["mobile"],
  Customer: ["mobile", "admin"],
  Depot: ["mobile", "admin"],
};

const ROLE_STATUS_PERMISSIONS = {
  Admin: {
    Owner_Preparing: ["update_status", "confirm_delivery"],
    Sent_To_Factory: ["update_status"],
    Ready_For_Delivery: ["update_status"],
    Recieve_By_Customer: ["update_status", "confirm_delivery"],
  },
  Owner: {
    Owner_Preparing: ["update_status"],
    Sent_To_Factory: ["update_status"],
    Ready_For_Delivery: ["update_status"],
  },
  Logistics: {
    Ready_For_Delivery: ["update_status"],
  },
  Delivery: {
    Ready_For_Delivery: ["update_status"],
    Recieve_By_Customer: ["update_status", "confirm_delivery"],
  },
};

const ROLE_SOCKET_CHANNELS = {
  Admin: ["delivery-locations-watcher", "special-day-watcher"],
  Owner: ["delivery-locations-watcher", "special-day-watcher"],
  Logistics: ["delivery-locations-watcher"],
  Depot: ["delivery-locations-watcher"],
};

const STATUS_TRANSITIONS = {
  Owner_Preparing: ["Sent_To_Factory"],
  Sent_To_Factory: ["Ready_For_Delivery"],
  Ready_For_Delivery: ["Recieve_By_Customer"],
  Recieve_By_Customer: [],
};

const STATUS_NAMES = [
  "Owner_Preparing",
  "Sent_To_Factory",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

const ADMIN_MENUS = [
  "overview",
  "catalogs",
  "items",
  "customerItemPrices",
  "depotItemPrices",
  "customers",
  "trackingCustomerLocation",
  "provinces",
  "depots",
  "customersByDepot",
  "customerPriority",
  "producers",
  "deliveryAgents",
  "orders",
  "assignOrders",
  "payments",
  "customerOrderHistory",
  "users",
  "borrowedMaterials",
  "specialDay",
];

const ADMIN_MANAGE_MENUS = [
  "catalogs",
  "items",
  "customerItemPrices",
  "depotItemPrices",
  "customers",
  "provinces",
  "depots",
  "customerPriority",
  "producers",
  "deliveryAgents",
  "users",
  "borrowedMaterials",
];

/** Kept for login payload compatibility; mobile app uses its own role JSON. */
const ROLE_ADMIN_MENUS = {
  Admin: [...ADMIN_MENUS],
  Owner: ADMIN_MENUS.filter((key) => key !== "users"),
  Logistics: ["overview", "deliveryAgents", "orders"],
  Delivery: ["overview", "orders"],
  Customer: ["overview", "orders", "customerOrderHistory"],
  Depot: [
    "overview",
    "customers",
    "trackingCustomerLocation",
    "customersByDepot",
    "customerItemPrices",
    "depotItemPrices",
    "orders",
    "payments",
    "customerOrderHistory",
    "borrowedMaterials",
  ],
};

const ROLE_MOBILE_MENUS = {
  Admin: ["mobile.adminHome", "mobile.profile"],
  Owner: ["mobile.adminHome", "mobile.profile"],
  Delivery: ["mobile.live", "mobile.specialDay", "mobile.profile"],
  Customer: ["mobile.newOrder", "mobile.myOrders", "mobile.specialDay", "mobile.tracking", "mobile.profile"],
  Depot: ["mobile.prepareBatch", "mobile.depotOrders", "mobile.specialDay", "mobile.tracking", "mobile.profile"],
};

function getDataScopeForRole(roleName) {
  return ROLE_DATA_SCOPE[roleName] || "none";
}

function getClientsForRole(roleName) {
  return ROLE_CLIENTS[roleName] ? [...ROLE_CLIENTS[roleName]] : [];
}

function getStatusPermissionsForRole(roleName) {
  const perms = ROLE_STATUS_PERMISSIONS[roleName];
  return perms ? JSON.parse(JSON.stringify(perms)) : {};
}

function getSocketChannelsForRole(roleName) {
  return ROLE_SOCKET_CHANNELS[roleName] ? [...ROLE_SOCKET_CHANNELS[roleName]] : [];
}

function getAdminMenusForRole(roleName) {
  return ROLE_ADMIN_MENUS[roleName] ? [...ROLE_ADMIN_MENUS[roleName]] : [];
}

function getManageMenusForRole(roleName) {
  if (roleName === "Admin" || roleName === "Owner") {
    return ADMIN_MANAGE_MENUS.filter((key) => getAdminMenusForRole(roleName).includes(key));
  }
  return [];
}

function getMobileMenusForRole(roleName) {
  return ROLE_MOBILE_MENUS[roleName] ? [...ROLE_MOBILE_MENUS[roleName]] : [];
}

function getNextStatuses(fromStatusName) {
  const next = STATUS_TRANSITIONS[fromStatusName];
  return Array.isArray(next) ? [...next] : [];
}

function canSetStatus(roleName, toStatus, action = "update_status") {
  const perms = ROLE_STATUS_PERMISSIONS[roleName];
  if (!perms || !perms[toStatus]) return false;
  return perms[toStatus].includes(action);
}

function canSubscribeSocket(roleName, channelKey) {
  const channels = ROLE_SOCKET_CHANNELS[roleName];
  if (!Array.isArray(channels)) return false;
  return channels.includes(channelKey);
}

function canUseClient(roleName, client) {
  if (!client) return true;
  return getClientsForRole(roleName).includes(client);
}

module.exports = {
  ROLE_NAMES,
  ROLE_DATA_SCOPE,
  ROLE_CLIENTS,
  ROLE_STATUS_PERMISSIONS,
  ROLE_SOCKET_CHANNELS,
  STATUS_TRANSITIONS,
  STATUS_NAMES,
  ADMIN_MENUS,
  ADMIN_MANAGE_MENUS,
  ROLE_ADMIN_MENUS,
  ROLE_MOBILE_MENUS,
  getDataScopeForRole,
  getClientsForRole,
  getStatusPermissionsForRole,
  getSocketChannelsForRole,
  getAdminMenusForRole,
  getManageMenusForRole,
  getMobileMenusForRole,
  getNextStatuses,
  canSetStatus,
  canSubscribeSocket,
  canUseClient,
};
