/**
 * Zod schemas for the authentication endpoints.
 */
const { z } = require("zod");

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  client: z.enum(["admin", "mobile"]).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

module.exports = { loginSchema, changePasswordSchema };
