const { z } = require("zod");
const { ROLES } = require("../constants");
const { MENU_KEY_SET } = require("../constants/roleMenus");
const { listRoleMenusMap, replaceRoleMenus } = require("../repositories");
const { success, fail } = require("../utils/response");

async function getRoleMenus(_req, res) {
  const data = await listRoleMenusMap();
  return success(res, data);
}

async function saveRoleMenus(req, res) {
  const roleName = req.params.roleName;
  if (!ROLES.includes(roleName)) {
    return fail(res, { status: 400, message: "Unknown role" });
  }
  const schema = z.object({
    menuKeys: z.array(z.string()).min(1, "Select at least one menu"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid menu payload" });
  }
  for (const k of parsed.data.menuKeys) {
    if (!MENU_KEY_SET.has(k)) {
      return fail(res, { status: 400, message: `Invalid menu key: ${k}` });
    }
  }
  try {
    const menuKeys = await replaceRoleMenus(roleName, parsed.data.menuKeys);
    return success(res, { role: roleName, menuKeys });
  } catch (error) {
    if (error && error.message === "Role not found") {
      return fail(res, { status: 400, message: "Role not found" });
    }
    throw error;
  }
}

module.exports = {
  getRoleMenus,
  saveRoleMenus,
};
