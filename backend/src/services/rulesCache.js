const { listRoleNames } = require("../repositories/roles");
const { listMenuKeys, listMenus } = require("../repositories/menus");
const { listOrderStatuses } = require("../repositories/lookups");
const { listTransitionsMap } = require("../repositories/statusTransitions");
const { listDataScopeMap } = require("../repositories/roleAccess");
const { listRoleClientsMap } = require("../repositories/roleClients");
const { listRoleStatusPermissionsMap } = require("../repositories/roleStatusPermissions");
const { listRoleSocketChannelsMap } = require("../repositories/roleSocketChannels");

let cache = {
  roleNames: [],
  dataScopeByRole: {},
  roleClients: {},
  statusPermissions: {},
  socketChannels: {},
  menuKeys: new Set(),
  menus: [],
  statusNames: [],
  transitions: {},
  loaded: false,
};

function getRoleNames() {
  return cache.roleNames;
}

function isKnownRole(roleName) {
  return cache.roleNames.includes(roleName);
}

function getDataScope(roleName) {
  return cache.dataScopeByRole[roleName] || "none";
}

function getClientsForRole(roleName) {
  return cache.roleClients[roleName] ? [...cache.roleClients[roleName]] : [];
}

function canUseClient(roleName, client) {
  if (!client) return true;
  const allowed = cache.roleClients[roleName];
  if (!Array.isArray(allowed) || !allowed.length) return false;
  return allowed.includes(client);
}

function getStatusPermissionsForRole(roleName) {
  const perms = cache.statusPermissions[roleName];
  return perms ? { ...perms } : {};
}

function canSetStatus(roleName, toStatus, action = "update_status") {
  const perms = cache.statusPermissions[roleName];
  if (!perms || !perms[toStatus]) return false;
  return perms[toStatus].includes(action);
}

function canUpdateAnyStatus(roleName) {
  const perms = cache.statusPermissions[roleName];
  if (!perms) return false;
  return Object.keys(perms).length > 0;
}

function canSubscribeSocket(roleName, channelKey) {
  const channels = cache.socketChannels[roleName];
  if (!Array.isArray(channels)) return false;
  return channels.includes(channelKey);
}

function getSocketChannelsForRole(roleName) {
  return cache.socketChannels[roleName] ? [...cache.socketChannels[roleName]] : [];
}

function getMenuKeys() {
  return cache.menuKeys;
}

function getMenus() {
  return [...cache.menus];
}

function getMenusByClient(client) {
  return cache.menus.filter((m) => m.client === client);
}

function getMenuAccessLevel(menuKey) {
  const menu = cache.menus.find((m) => m.menuKey === menuKey);
  return menu?.accessLevel || "view";
}

function isKnownMenuKey(menuKey) {
  return cache.menuKeys.has(menuKey);
}

function getStatusNames() {
  return cache.statusNames;
}

function isKnownStatus(statusName) {
  return cache.statusNames.includes(statusName);
}

function getNextStatuses(fromStatusName) {
  const mapped = cache.transitions[fromStatusName];
  if (Array.isArray(mapped)) return [...mapped];
  return [];
}

function getTransitionsMap() {
  return { ...cache.transitions };
}

function getRoleAccessSnapshot() {
  return {
    roleNames: [...cache.roleNames],
    dataScopeByRole: { ...cache.dataScopeByRole },
    roleClients: { ...cache.roleClients },
    statusPermissions: { ...cache.statusPermissions },
    socketChannels: { ...cache.socketChannels },
  };
}

function isLoaded() {
  return cache.loaded;
}

async function refreshRulesCache() {
  const [
    roleNames,
    menuRows,
    statuses,
    transitions,
    dataScopeByRole,
    roleClients,
    statusPermissions,
    socketChannels,
  ] = await Promise.all([
    listRoleNames(),
    listMenus(),
    listOrderStatuses(),
    listTransitionsMap(),
    listDataScopeMap(),
    listRoleClientsMap(),
    listRoleStatusPermissionsMap(),
    listRoleSocketChannelsMap(),
  ]);

  cache = {
    roleNames,
    dataScopeByRole,
    roleClients,
    statusPermissions,
    socketChannels,
    menuKeys: new Set(menuRows.map((row) => row.menuKey)),
    menus: menuRows,
    statusNames: statuses.map((row) => row.name),
    transitions,
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
