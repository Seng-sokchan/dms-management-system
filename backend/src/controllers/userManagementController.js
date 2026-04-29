const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { ROLES } = require("../constants");
const {
  listUsers: listUsersDb,
  createUser: createUserDb,
  updateUser: updateUserDb,
  deactivateUser: deactivateUserDb,
  getUserById,
} = require("../repositories");

async function listUsers(_req, res) {
  const users = await listUsersDb();
  res.json(users);
}

async function createUser(req, res) {
  const schema = z.object({
    name: z.string().min(2),
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(ROLES),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user payload" });
  }
  const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
  try {
    const user = await createUserDb({
      name: parsed.data.name,
      username: parsed.data.username,
      role: parsed.data.role,
      passwordHash,
    });
    return res.status(201).json(user);
  } catch (error) {
    if (error && error.message === "Role not found") {
      return res.status(400).json({ message: "Role not found" });
    }
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Username already exists" });
    }
    throw error;
  }
}

async function updateUser(req, res) {
  const schema = z.object({
    name: z.string().min(2).optional(),
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(ROLES).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user payload" });
  }

  if (req.user.sub === req.params.id && parsed.data.role && parsed.data.role !== req.user.role) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }

  const payload = {
    ...parsed.data,
    passwordHash: parsed.data.password ? bcrypt.hashSync(parsed.data.password, 10) : undefined,
  };
  delete payload.password;

  try {
    const user = await updateUserDb(req.params.id, payload);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    if (error && error.message === "Role not found") {
      return res.status(400).json({ message: "Role not found" });
    }
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Username already exists" });
    }
    throw error;
  }
}

async function deactivateUser(req, res) {
  if (req.user.sub === req.params.id) {
    return res.status(400).json({ message: "You cannot deactivate your own account" });
  }

  const existing = await getUserById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "User not found" });
  }

  const deleted = await deactivateUserDb(req.params.id);
  if (!deleted) {
    return res.status(400).json({ message: "User already inactive" });
  }
  return res.status(204).send();
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
};
