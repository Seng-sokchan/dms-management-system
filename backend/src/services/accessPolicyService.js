const {
  getDataScopeForRole,
  getClientsForRole,
  getAdminMenusForRole,
  getManageMenusForRole,
  getMobileMenusForRole,
  getStatusPermissionsForRole,
  getSocketChannelsForRole,
  canUseClient,
  canSetStatus,
  canSubscribeSocket,
} = require("../constants/roleAccessRules");

async function getAccessProfileForRole(roleName) {
  return {
    dataScope: getDataScopeForRole(roleName),
    allowedClients: getClientsForRole(roleName),
    allowedMenus: getAdminMenusForRole(roleName),
    allowedMobileMenus: getMobileMenusForRole(roleName),
    manageMenus: getManageMenusForRole(roleName),
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

module.exports = {
  getDataScopeForRole,
  getAccessProfileForRole,
  assertCanUseClient,
  assertCanSetStatus,
  assertCanSubscribeSocket,
  canUseClient,
  canSetStatus,
  canSubscribeSocket,
};
