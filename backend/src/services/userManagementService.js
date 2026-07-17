const bcrypt = require("bcryptjs");
const {
  isAutoCredentialRole,
  nextUsernameForRole,
  generateRandomPassword,
} = require("../utils/userCredentials");
const {
  listUsers: listUsersDb,
  createUser: createUserDb,
  updateUser: updateUserDb,
  deactivateUser: deactivateUserDb,
  getUserById,
  getCustomerById,
  getDeliveryAgentById,
  getDepotById,
  setCustomerUserLink,
  setDeliveryAgentUserLink,
  setDepotUserLink,
} = require("../repositories");
const { BadRequestError, NotFoundError, ConflictError } = require("../errors");

const HIDDEN_USERNAMES = new Set(["admin"]);

function isHiddenUser(user) {
  return Boolean(user && HIDDEN_USERNAMES.has(String(user.username || "").trim().toLowerCase()));
}

async function listUsers() {
  const users = await listUsersDb();
  return users.filter((user) => !isHiddenUser(user));
}

async function createUser(payload) {
  let username = String(payload.username || "").trim();
  let plainPassword = payload.password || "";
  let generatedPassword = null;

  if (isAutoCredentialRole(payload.role)) {
    // Auto-assign username and password for Customer/Depot roles
    const allUsers = await listUsersDb();
    const existingUsernames = allUsers.map((u) => u.username);
    username = nextUsernameForRole(payload.role, existingUsernames);
    plainPassword = generateRandomPassword();
    generatedPassword = plainPassword;
  }

  if (HIDDEN_USERNAMES.has(username.toLowerCase())) {
    throw new BadRequestError("Username is reserved");
  }
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const rawAgent = payload.deliveryAgentId;
  const hasAgentLink = rawAgent != null && String(rawAgent).trim() !== "";
  if (hasAgentLink && payload.role !== "Delivery") {
    throw new BadRequestError("deliveryAgentId is only valid for Delivery role");
  }
  const rawDepot = payload.depotId;
  const hasDepotLink = rawDepot != null && String(rawDepot).trim() !== "";
  if (hasDepotLink && payload.role !== "Depot") {
    throw new BadRequestError("depotId is only valid for Depot role");
  }
  try {
    const created = await createUserDb({
      name: payload.name,
      username,
      role: payload.role,
      passwordHash,
    });
    if (payload.role === "Delivery" && hasAgentLink) {
      const agent = await getDeliveryAgentById(String(rawAgent));
      if (!agent) throw new BadRequestError("Delivery agent not found");
      await setDeliveryAgentUserLink(null, Number(rawAgent), Number(created.id));
    }
    if (payload.role === "Depot" && hasDepotLink) {
      const depot = await getDepotById(String(rawDepot));
      if (!depot) throw new BadRequestError("Depot not found");
      await setDepotUserLink(null, Number(rawDepot), Number(created.id));
    }
    const user = await getUserById(created.id);
    if (generatedPassword !== null) {
      return { ...user, generatedPassword };
    }
    return user;
  } catch (error) {
    if (error && error.message === "Role not found") throw new BadRequestError("Role not found");
    if (error && error.code === "ER_DUP_ENTRY") throw new ConflictError("Username already exists");
    throw error;
  }
}

async function updateUser(currentUser, userId, payload) {
  if (
    String(currentUser.sub) === String(userId) &&
    payload.role &&
    payload.role !== currentUser.role
  ) {
    throw new BadRequestError("You cannot change your own role");
  }

  const existingBefore = await getUserById(userId);
  if (!existingBefore) throw new NotFoundError("User not found");
  if (isHiddenUser(existingBefore)) {
    throw new BadRequestError("System admin user cannot be modified");
  }
  if (
    payload.username &&
    HIDDEN_USERNAMES.has(String(payload.username).trim().toLowerCase())
  ) {
    throw new BadRequestError("Username is reserved");
  }

  const nextPayload = {
    ...payload,
    passwordHash: payload.password ? await bcrypt.hash(payload.password, 10) : undefined,
  };
  delete nextPayload.password;
  delete nextPayload.customerId;
  delete nextPayload.deliveryAgentId;
  delete nextPayload.depotId;

  try {
    const user = await updateUserDb(userId, nextPayload);
    if (!user) throw new NotFoundError("User not found");

    if (user.role !== "Delivery") {
      await setDeliveryAgentUserLink(null, null, Number(userId));
    }

    if (user.role !== "Depot") {
      await setDepotUserLink(null, null, Number(userId));
    }

    if (Object.prototype.hasOwnProperty.call(payload, "customerId")) {
      const cidRaw = payload.customerId;
      const hasLink = cidRaw != null && String(cidRaw).trim() !== "";
      if (hasLink) {
        if (user.role !== "Customer") {
          throw new BadRequestError("Only Customer role users may be linked to a customer");
        }
        const customer = await getCustomerById(String(cidRaw));
        if (!customer) throw new BadRequestError("Customer not found");
      }
      await setCustomerUserLink(
        null,
        hasLink ? Number(cidRaw) : null,
        Number(userId),
      );
    }

    if (Object.prototype.hasOwnProperty.call(payload, "deliveryAgentId")) {
      const aidRaw = payload.deliveryAgentId;
      const hasAgentLink = aidRaw != null && String(aidRaw).trim() !== "";
      if (hasAgentLink) {
        if (user.role !== "Delivery") {
          throw new BadRequestError("Only Delivery role users may be linked to a delivery agent");
        }
        const agent = await getDeliveryAgentById(String(aidRaw));
        if (!agent) throw new BadRequestError("Delivery agent not found");
      }
      await setDeliveryAgentUserLink(
        null,
        hasAgentLink ? Number(aidRaw) : null,
        Number(userId),
      );
    }

    if (Object.prototype.hasOwnProperty.call(payload, "depotId")) {
      const didRaw = payload.depotId;
      const hasDepotLink = didRaw != null && String(didRaw).trim() !== "";
      if (hasDepotLink) {
        if (user.role !== "Depot") {
          throw new BadRequestError("Only Depot role users may be linked to a depot");
        }
        const depot = await getDepotById(String(didRaw));
        if (!depot) throw new BadRequestError("Depot not found");
      }
      await setDepotUserLink(
        null,
        hasDepotLink ? Number(didRaw) : null,
        Number(userId),
      );
    }

    return getUserById(userId);
  } catch (error) {
    if (error && error.message === "Role not found") throw new BadRequestError("Role not found");
    if (error && error.code === "ER_DUP_ENTRY") throw new ConflictError("Username already exists");
    throw error;
  }
}

async function deactivateUser(currentUser, userId) {
  if (String(currentUser.sub) === String(userId)) {
    throw new BadRequestError("You cannot deactivate your own account");
  }
  const existing = await getUserById(userId);
  if (!existing) throw new NotFoundError("User not found");
  if (isHiddenUser(existing)) {
    throw new BadRequestError("System admin user cannot be deactivated");
  }
  const deleted = await deactivateUserDb(userId);
  if (!deleted) throw new BadRequestError("User already inactive");
  return deleted;
}

async function resetUserPassword(currentUser, userId) {
  if (String(currentUser.sub) === String(userId)) {
    throw new BadRequestError("You cannot reset your own password here");
  }
  const existing = await getUserById(userId);
  if (!existing) throw new NotFoundError("User not found");
  if (isHiddenUser(existing)) {
    throw new BadRequestError("System admin user password cannot be reset");
  }
  if (!existing.isActive) {
    throw new BadRequestError("Cannot reset password for an inactive user");
  }

  const plainPassword = generateRandomPassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const user = await updateUserDb(userId, { passwordHash });
  if (!user) throw new NotFoundError("User not found");

  const refreshed = await getUserById(userId);
  return { ...refreshed, generatedPassword: plainPassword };
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
};
