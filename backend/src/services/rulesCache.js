const { listRoleNames } = require("../repositories/roles");
const { listOrderStatuses } = require("../repositories/lookups");
const {
  ROLE_NAMES,
  ROLE_DATA_SCOPE,
  ROLE_CLIENTS,
  ROLE_STATUS_PERMISSIONS,
  ROLE_SOCKET_CHANNELS,
  STATUS_TRANSITIONS,
  STATUS_NAMES,
  getDataScopeForRole,
  getClientsForRole,
  getStatusPermissionsForRole,
  getSocketChannelsForRole,
  getNextStatuses,
  canSetStatus,
  canSubscribeSocket,
  canUseClient,
} = require("../constants/roleAccessRules");

let cache = {
  roleNames: [...ROLE_NAMES],
  statusNames: [...STATUS_NAMES],
  loaded: false,
};

function getRoleNames() {
  return cache.roleNames.length ? cache.roleNames : [...ROLE_NAMES];
}

function isKnownRole(roleName) {
  return getRoleNames().includes(roleName);
}

function getDataScope(roleName) {
  return getDataScopeForRole(roleName);
}

function canUpdateAnyStatus(roleName) {
  const perms = ROLE_STATUS_PERMISSIONS[roleName];
  if (!perms) return false;
  return Object.keys(perms).length > 0;
}

function getMenuKeys() {
  return new Set();
}

function getMenus() {
  return [];
}

function getMenusByClient() {
  return [];
}

function getMenuAccessLevel() {
  return "view";
}

function isKnownMenuKey() {
  return false;
}

function getStatusNames() {
  return cache.statusNames.length ? cache.statusNames : [...STATUS_NAMES];
}

function isKnownStatus(statusName) {
  return getStatusNames().includes(statusName);
}

function getTransitionsMap() {
  return JSON.parse(JSON.stringify(STATUS_TRANSITIONS));
}

function getRoleAccessSnapshot() {
  return {
    roleNames: getRoleNames(),
    dataScopeByRole: { ...ROLE_DATA_SCOPE },
    roleClients: { ...ROLE_CLIENTS },
    statusPermissions: JSON.parse(JSON.stringify(ROLE_STATUS_PERMISSIONS)),
    socketChannels: { ...ROLE_SOCKET_CHANNELS },
  };
}

function isLoaded() {
  return cache.loaded;
}

async function refreshRulesCache() {
  const [roleNames, statuses] = await Promise.all([listRoleNames(), listOrderStatuses()]);
  cache = {
    roleNames: roleNames.length ? roleNames : [...ROLE_NAMES],
    statusNames: statuses.length ? statuses.map((row) => row.name) : [...STATUS_NAMES],
    loaded: true,
  };
  return cache;
}

module.exports = {
  getRoleNames,
  isKnownRole,
  getDataScope,
  getClientsForRole,
  canUseClient,
  getStatusPermissionsForRole,
  canSetStatus,
  canUpdateAnyStatus,
  canSubscribeSocket,
  getSocketChannelsForRole,
  getMenuKeys,
  getMenus,
  getMenusByClient,
  getMenuAccessLevel,
  isKnownMenuKey,
  getStatusNames,
  isKnownStatus,
  getNextStatuses,
  getTransitionsMap,
  getRoleAccessSnapshot,
  isLoaded,
  refreshRulesCache,
};
