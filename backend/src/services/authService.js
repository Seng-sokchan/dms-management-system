const bcrypt = require("bcryptjs");
const { createToken } = require("../middleware/auth");
const { getUserByUsername, listMenuKeysForRoleName, getCustomerByUserId } = require("../repositories");
const { UnauthorizedError, ForbiddenError } = require("../errors");

// Role policy per client surface. A missing/unknown client is permissive for
// backward compatibility while older clients roll out the new field.
const ADMIN_PANEL_ROLES = new Set(["Admin", "Owner"]);
const MOBILE_APP_ROLES = new Set(["Customer", "Delivery", "Depot"]);

function assertRoleAllowedForClient(role, client) {
  if (client === "admin" && !ADMIN_PANEL_ROLES.has(role)) {
    throw new ForbiddenError(
      "This account cannot use the admin panel. Please use the mobile app.",
    );
  }
  if (client === "mobile" && !MOBILE_APP_ROLES.has(role)) {
    throw new ForbiddenError(
      "This account cannot use the mobile app. Please use the admin panel.",
    );
  }
}

async function login({ username, password, client }) {
  const user = await getUserByUsername(username);
  const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !isValidPassword) {
    throw new UnauthorizedError("Invalid credentials");
  }

  assertRoleAllowedForClient(user.role, client);

  const token = createToken(user);
  const allowedMenus = await listMenuKeysForRoleName(user.role);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      allowedMenus,
    },
  };
}

async function me(currentUser) {
  const allowedMenus = await listMenuKeysForRoleName(currentUser.role);
  const base = {
    id: currentUser.sub,
    name: currentUser.name,
    username: currentUser.username,
    role: currentUser.role,
    allowedMenus,
  };
  if (currentUser.role === "Customer") {
    const customer = await getCustomerByUserId(currentUser.sub);
    return { ...base, customerId: customer?.id ?? null };
  }
  if (currentUser.role === "Delivery") {
    const aid = currentUser.deliveryAgentId;
    return {
      ...base,
      deliveryAgentId:
        aid != null && String(aid).trim() !== "" ? String(aid) : null,
    };
  }
  return base;
}

module.exports = {
  login,
  me,
};
