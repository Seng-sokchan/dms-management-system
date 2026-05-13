const bcrypt = require("bcryptjs");
const {
  listUsers: listUsersDb,
  createUser: createUserDb,
  updateUser: updateUserDb,
  deactivateUser: deactivateUserDb,
  getUserById,
  getCustomerById,
  getDeliveryAgentById,
  setCustomerUserLink,
  setDeliveryAgentUserLink,
} = require("../repositories");
const { BadRequestError, NotFoundError, ConflictError } = require("../errors");

async function listUsers() {
  return listUsersDb();
}

async function createUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const rawAgent = payload.deliveryAgentId;
  const hasAgentLink = rawAgent != null && String(rawAgent).trim() !== "";
  if (hasAgentLink && payload.role !== "Delivery") {
    throw new BadRequestError("deliveryAgentId is only valid for Delivery role");
  }
  try {
    const created = await createUserDb({
      name: payload.name,
      username: payload.username,
      role: payload.role,
      passwordHash,
    });
    if (payload.role === "Delivery" && hasAgentLink) {
      const agent = await getDeliveryAgentById(String(rawAgent));
      if (!agent) throw new BadRequestError("Delivery agent not found");
      await setDeliveryAgentUserLink(null, Number(rawAgent), Number(created.id));
    }
    return getUserById(created.id);
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

  const nextPayload = {
    ...payload,
    passwordHash: payload.password ? await bcrypt.hash(payload.password, 10) : undefined,
  };
  delete nextPayload.password;
  delete nextPayload.customerId;
  delete nextPayload.deliveryAgentId;

  try {
    const user = await updateUserDb(userId, nextPayload);
    if (!user) throw new NotFoundError("User not found");

    if (user.role !== "Delivery") {
      await setDeliveryAgentUserLink(null, null, Number(userId));
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
  const deleted = await deactivateUserDb(userId);
  if (!deleted) throw new BadRequestError("User already inactive");
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
};
