const { isKnownRole, isKnownMenuKey } = require("./rulesService");
const { refreshRulesCache } = require("./rulesCache");
const { listRoleMenusMap, replaceRoleMenus } = require("../repositories");
const { BadRequestError, NotFoundError } = require("../errors");

async function getRoleMenus() {
  return listRoleMenusMap();
}

async function saveRoleMenus(roleName, menuKeys) {
  if (!isKnownRole(roleName)) throw new BadRequestError("Unknown role");
  for (const key of menuKeys) {
    if (!isKnownMenuKey(key)) throw new BadRequestError(`Invalid menu key: ${key}`);
  }
  try {
    const nextMenuKeys = await replaceRoleMenus(roleName, menuKeys);
    await refreshRulesCache();
    return { role: roleName, menuKeys: nextMenuKeys };
  } catch (error) {
    if (error && error.message === "Role not found") throw new NotFoundError("Role not found");
    throw error;
  }
}

module.exports = {
  getRoleMenus,
  saveRoleMenus,
};
