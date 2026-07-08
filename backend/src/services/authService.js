const bcrypt = require("bcryptjs");
const { createToken } = require("../middleware/auth");
const { getUserByUsername, getCustomerByUserId } = require("../repositories");
const { UnauthorizedError } = require("../errors");
const {
  assertCanUseClient,
  getAccessProfileForRole,
} = require("./accessPolicyService");

async function login({ username, password, client }) {
  const user = await getUserByUsername(username);
  const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !isValidPassword) {
    throw new UnauthorizedError("Invalid credentials");
  }

  assertCanUseClient(user.role, client);

  const token = createToken(user);
  const profile = await getAccessProfileForRole(user.role);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      ...profile,
    },
  };
}

async function me(currentUser) {
  const profile = await getAccessProfileForRole(currentUser.role);
  const base = {
    id: currentUser.sub,
    name: currentUser.name,
    username: currentUser.username,
    role: currentUser.role,
    isActive: currentUser.isActive !== false,
    ...profile,
  };
  if (profile.dataScope === "customer") {
    const customer = await getCustomerByUserId(currentUser.sub);
    return { ...base, customerId: customer?.id ?? null };
  }
  if (profile.dataScope === "delivery_agent") {
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
