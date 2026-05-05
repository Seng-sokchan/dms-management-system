const { z } = require("zod");
const { ROLES } = require("../constants");

const createUserSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(ROLES),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(ROLES).optional(),
});

const userIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "User id must be numeric"),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
};
