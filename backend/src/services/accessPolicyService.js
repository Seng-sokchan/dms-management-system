const { listMenuKeysForRoleName, listManageMenuKeysForRoleName } = require("../repositories/roleMenus");
const {
  getDataScope,
  canUseClient,
  canSetStatus,
  canSubscribeSocket,
  getMenuAccessLevel,
  getClientsForRole,
  getStatusPermissionsForRole,
  getSocketChannelsForRole,
} = require("./rulesCache");

function getDataScopeForRole(roleName) {
  return getDataScope(roleName);
}

async function getAccessProfileForRole(roleName) {
  const [allowedMenus, allowedMobileMenus, manageMenus] = await Promise.all([
    listMenuKeysForRoleName(roleName, { client: "admin" }),
    listMenuKeysForRoleName(roleName, { client: "mobile" }),
    listManageMenuKeysForRoleName(roleName, { client: "admin" }),
  ]);

  return {
    dataScope: getDataScope(roleName),
    allowedClients: getClientsForRole(roleName),
    allowedMenus,
    allowedMobileMenus,
    manageMenus,
    statusPermissions: getStatusPermissionsForRole(roleName),
    socketChannels: getSocketChannelsForRole(roleName),
  };
}

function assertCanUseClient(roleName, client) {
  if (!canUseClient(roleName, client)) {
    const { ForbiddenError } = require("../errors");
    if (client === "admin") {
      throw new ForbiddenError(
        "This account cannot use the admin panel. Please use the mobile app.",
      );
    }
    if (client === "mobile") {
      throw new ForbiddenError(
        "This account cannot use the mobile app. Please use the admin panel.",
      );
    }
    throw new ForbiddenError("This account cannot use this client.");
  }
}

function assertCanSetStatus(roleName, toStatus, action = "update_status") {
  if (!canSetStatus(roleName, toStatus, action)) {
    const { ForbiddenError } = require("../errors");
    throw new ForbiddenError(`Unauthorized to set status: ${toStatus}`);
  }
}

function assertCanSubscribeSocket(roleName, channelKey) {
  if (!canSubscribeSocket(roleName, channelKey)) {
    const { ForbiddenError } = require("../errors");
    throw new ForbiddenError("Unauthorized socket channel");
  }
}

function canManageMenu(roleName, menuKey) {
  const level = getMenuAccessLevel(menuKey);
  return level === "manage";
}

module.exports = {
  getDataScopeForRole,
  getAccessProfileForRole,
  assertCanUseClient,
  assertCanSetStatus,
  assertCanSubscribeSocket,
  canManageMenu,
  canUseClient,
  canSetStatus,
  canSubscribeSocket,
};
