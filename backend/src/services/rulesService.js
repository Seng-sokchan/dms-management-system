const {
  isKnownRole,
  isKnownMenuKey,
  isKnownStatus,
  getRoleNames,
  getMenuKeys,
  getStatusNames,
  getTransitionsMap,
  refreshRulesCache,
} = require("./rulesCache");
const { listMenus } = require("../repositories/menus");
const { listRoles } = require("../repositories/roles");
const { listTransitionsMap, replaceTransitions } = require("../repositories/statusTransitions");
const { getRoleAccessMatrix, updateRoleDataScope } = require("../repositories/roleAccess");
const { replaceRoleClients } = require("../repositories/roleClients");
const { replaceAllRoleStatusPermissions } = require("../repositories/roleStatusPermissions");
const { replaceRoleSocketChannels } = require("../repositories/roleSocketChannels");
const { getRoleIdByName } = require("../repositories/roleMenus");
const lookupRepository = require("../repositories/lookups");
const { BadRequestError } = require("../errors");

const VALID_CLIENTS = new Set(["admin", "mobile"]);
const VALID_DATA_SCOPES = new Set(["all", "owner", "depot", "customer", "delivery_agent", "none"]);
const VALID_STATUS_ACTIONS = new Set(["update_status", "confirm_delivery"]);

async function getRoles() {
  return listRoles();
}

async function getMenus({ client } = {}) {
  return listMenus({ client });
}

async function getStatusTransitions() {
  return listTransitionsMap();
}

async function getRoleAccess() {
  return getRoleAccessMatrix();
}

async function saveStatusTransitions(transitions) {
  const statusNames = getStatusNames();
  if (!Array.isArray(transitions) || transitions.length === 0) {
    throw new BadRequestError("Transitions payload is required");
  }

  for (const entry of transitions) {
    if (!entry || typeof entry.fromStatus !== "string") {
      throw new BadRequestError("Each transition entry requires fromStatus");
    }
    if (!isKnownStatus(entry.fromStatus)) {
      throw new BadRequestError(`Unknown status: ${entry.fromStatus}`);
    }
    const toStatuses = Array.isArray(entry.toStatuses) ? entry.toStatuses : [];
    for (const toStatus of toStatuses) {
      if (!isKnownStatus(toStatus)) {
        throw new BadRequestError(`Unknown status: ${toStatus}`);
      }
      if (toStatus === entry.fromStatus) {
        throw new BadRequestError(`Status cannot transition to itself: ${toStatus}`);
      }
    }
  }

  const covered = new Set(transitions.map((entry) => entry.fromStatus));
  for (const statusName of statusNames) {
    if (!covered.has(statusName)) {
      throw new BadRequestError(`Missing transitions for status: ${statusName}`);
    }
  }

  const nextMap = await replaceTransitions(transitions);
  await refreshRulesCache();
  return nextMap;
}

async function saveRoleAccess(roleName, payload) {
  if (!isKnownRole(roleName)) {
    throw new BadRequestError(`Unknown role: ${roleName}`);
  }

  if (payload.dataScope != null) {
    if (!VALID_DATA_SCOPES.has(payload.dataScope)) {
      throw new BadRequestError(`Invalid data scope: ${payload.dataScope}`);
    }
    await updateRoleDataScope(roleName, payload.dataScope);
  }

  if (Array.isArray(payload.clients)) {
    for (const client of payload.clients) {
      if (!VALID_CLIENTS.has(client)) {
        throw new BadRequestError(`Invalid client: ${client}`);
      }
    }
    await replaceRoleClients(roleName, payload.clients);
  }

  if (Array.isArray(payload.socketChannels)) {
    await replaceRoleSocketChannels(roleName, payload.socketChannels);
  }

  await refreshRulesCache();
  const matrix = await getRoleAccessMatrix();
  return matrix.find((row) => row.roleName === roleName) || null;
}

async function getRoleStatusPermissions() {
  const { listRoleStatusPermissionsMap } = require("../repositories/roleStatusPermissions");
  return listRoleStatusPermissionsMap();
}

async function saveRoleStatusPermissions(matrix) {
  if (!matrix || typeof matrix !== "object") {
    throw new BadRequestError("Status permissions payload is required");
  }

  const statuses = await lookupRepository.listOrderStatuses();
  const statusByName = Object.fromEntries(statuses.map((s) => [s.name, s.id]));
  const rows = [];

  for (const [roleName, perStatus] of Object.entries(matrix)) {
    if (!isKnownRole(roleName)) {
      throw new BadRequestError(`Unknown role: ${roleName}`);
    }
    const roleId = await getRoleIdByName(roleName);
    if (!roleId) continue;
    for (const [statusName, actions] of Object.entries(perStatus || {})) {
      if (!isKnownStatus(statusName)) {
        throw new BadRequestError(`Unknown status: ${statusName}`);
      }
      const statusId = statusByName[statusName];
      const actionList = Array.isArray(actions) ? actions : [];
      for (const action of actionList) {
        if (!VALID_STATUS_ACTIONS.has(action)) {
          throw new BadRequestError(`Invalid action: ${action}`);
        }
        rows.push({ roleId, toStatusId: statusId, action });
      }
    }
  }

  const nextMap = await replaceAllRoleStatusPermissions(rows);
  await refreshRulesCache();
  return nextMap;
}

module.exports = {
  getRoles,
  getMenus,
  getStatusTransitions,
  getRoleAccess,
  saveStatusTransitions,
  saveRoleAccess,
  getRoleStatusPermissions,
  saveRoleStatusPermissions,
  isKnownRole,
  isKnownMenuKey,
  isKnownStatus,
  getRoleNames,
  getMenuKeys,
  getStatusNames,
  getTransitionsMap,
  refreshRulesCache,
};
