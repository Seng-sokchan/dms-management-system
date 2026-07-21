const bcrypt = require("bcryptjs");
const { createToken } = require("../middleware/auth");
const {
  getUserByUsername,
  getUserById,
  getCustomerByUserId,
  getDeliveryAgentById,
  getDepotById,
  deactivateUser: deactivateUserDb,
} = require("../repositories");
const { UnauthorizedError, BadRequestError, NotFoundError } = require("../errors");
const {
  assertCanUseClient,
  getAccessProfileForRole,
} = require("./accessPolicyService");

const HIDDEN_USERNAMES = new Set(["admin"]);
const SELF_DELETE_BLOCKED_ROLES = new Set(["Admin", "Owner"]);

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

function normalizeLinkedId(value) {
  return value != null && String(value).trim() !== "" ? String(value) : null;
}

async function enrichProfileContact(base, profile, currentUser) {
  if (profile.dataScope === "customer") {
    const customer = await getCustomerByUserId(currentUser.sub);
    return {
      ...base,
      customerId: customer?.id ?? null,
      phone: customer?.phone ?? null,
    };
  }
  if (profile.dataScope === "delivery_agent") {
    const deliveryAgentId = normalizeLinkedId(currentUser.deliveryAgentId);
    const agent = deliveryAgentId ? await getDeliveryAgentById(deliveryAgentId) : null;
    return {
      ...base,
      deliveryAgentId,
      phone: agent?.phone ?? null,
    };
  }
  if (profile.dataScope === "depot") {
    const depotId = normalizeLinkedId(currentUser.depotId);
    const depot = depotId ? await getDepotById(depotId) : null;
    return {
      ...base,
      depotId,
      phone: depot?.phone ?? null,
    };
  }
  return base;
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
  return enrichProfileContact(base, profile, currentUser);
}

async function deleteMyAccount(currentUser) {
  const userId = currentUser.sub;
  const existing = await getUserById(userId);
  if (!existing) throw new NotFoundError("User not found");
  if (HIDDEN_USERNAMES.has(String(existing.username || "").trim().toLowerCase())) {
    throw new BadRequestError("System admin user cannot be deleted");
  }
  if (SELF_DELETE_BLOCKED_ROLES.has(String(existing.role || ""))) {
    throw new BadRequestError("Admin accounts cannot be deleted from this endpoint");
  }
  if (existing.isActive === false) {
    throw new BadRequestError("User already inactive");
  }
  const deleted = await deactivateUserDb(userId);
  if (!deleted) throw new BadRequestError("User already inactive");
  return { deleted: true };
}

module.exports = {
  login,
  me,
  deleteMyAccount,
};
