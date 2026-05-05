const { ROLES } = require("../constants");
const { MENU_KEY_SET } = require("../constants/roleMenus");
const { listRoleMenusMap, replaceRoleMenus } = require("../repositories");
const { BadRequestError, NotFoundError } = require("../errors");

async function getRoleMenus() {
  return listRoleMenusMap();
}

async function saveRoleMenus(roleName, menuKeys) {
  if (!ROLES.includes(roleName)) throw new BadRequestError("Unknown role");
  for (const key of menuKeys) {
    if (!MENU_KEY_SET.has(key)) throw new BadRequestError(`Invalid menu key: ${key}`);
  }
  try {
    const nextMenuKeys = await replaceRoleMenus(roleName, menuKeys);
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
