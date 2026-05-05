const bcrypt = require("bcryptjs");
const {
  listUsers: listUsersDb,
  createUser: createUserDb,
  updateUser: updateUserDb,
  deactivateUser: deactivateUserDb,
  getUserById,
} = require("../repositories");
const { BadRequestError, NotFoundError, ConflictError } = require("../errors");

async function listUsers() {
  return listUsersDb();
}

async function createUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 10);
  try {
    return await createUserDb({
      name: payload.name,
      username: payload.username,
      role: payload.role,
      passwordHash,
    });
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

  try {
    const user = await updateUserDb(userId, nextPayload);
    if (!user) throw new NotFoundError("User not found");
    return user;
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
