const { z } = require("zod");
const { ROLES } = require("../constants");
const { MENU_KEY_SET } = require("../constants/roleMenus");
const { listRoleMenusMap, replaceRoleMenus } = require("../db/dataStore");

async function getRoleMenus(_req, res) {
  const data = await listRoleMenusMap();
  return res.json(data);
}

async function saveRoleMenus(req, res) {
  const roleName = req.params.roleName;
  if (!ROLES.includes(roleName)) {
    return res.status(400).json({ message: "Unknown role" });
  }
  const schema = z.object({
    menuKeys: z.array(z.string()).min(1, "Select at least one menu"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid menu payload" });
  }
  for (const k of parsed.data.menuKeys) {
    if (!MENU_KEY_SET.has(k)) {
      return res.status(400).json({ message: `Invalid menu key: ${k}` });
    }
  }
  if (!parsed.data.menuKeys.includes("overview")) {
    return res.status(400).json({ message: "Overview must remain in the allowed menus" });
  }
  try {
    const menuKeys = await replaceRoleMenus(roleName, parsed.data.menuKeys);
    return res.json({ role: roleName, menuKeys });
  } catch (error) {
    if (error && error.message === "Role not found") {
      return res.status(400).json({ message: "Role not found" });
    }
    throw error;
  }
}

module.exports = {
  getRoleMenus,
  saveRoleMenus,
};
