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
const { success, created, noContent } = require("../utils/response");
const {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError,
} = require("../errors");

const listUsers = asyncHandler(async (_req, res) => {
  const users = await listUsersDb();
  return success(res, users);
});

const createUser = asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(ROLES),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError("Invalid user payload");
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    const user = await createUserDb({
      name: parsed.data.name,
      username: parsed.data.username,
      role: parsed.data.role,
      passwordHash,
    });
    return created(res, user);
  } catch (error) {
    if (error && error.message === "Role not found") {
      throw new BadRequestError("Role not found");
    }
    if (error && error.code === "ER_DUP_ENTRY") {
      throw new ConflictError("Username already exists");
    }
    throw error;
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(ROLES).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError("Invalid user payload");
  }

  if (req.user.sub === req.params.id && parsed.data.role && parsed.data.role !== req.user.role) {
    throw new BadRequestError("You cannot change your own role");
  }

  const payload = {
    ...parsed.data,
    passwordHash: parsed.data.password ? await bcrypt.hash(parsed.data.password, 10) : undefined,
  };
  delete payload.password;

  try {
    const user = await updateUserDb(req.params.id, payload);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return success(res, user);
  } catch (error) {
    if (error && error.message === "Role not found") {
      throw new BadRequestError("Role not found");
    }
    if (error && error.code === "ER_DUP_ENTRY") {
      throw new ConflictError("Username already exists");
    }
    throw error;
  }
});

const deactivateUser = asyncHandler(async (req, res) => {
  if (req.user.sub === req.params.id) {
    throw new BadRequestError("You cannot deactivate your own account");
  }

  const existing = await getUserById(req.params.id);
  if (!existing) {
    throw new NotFoundError("User not found");
  }

  const deleted = await deactivateUserDb(req.params.id);
  if (!deleted) {
    throw new BadRequestError("User already inactive");
  }
  return noContent(res);
});

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
};
