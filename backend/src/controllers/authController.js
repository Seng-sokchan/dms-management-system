const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { createToken } = require("../middleware/auth");
const { getUserByUsername, listMenuKeysForRoleName } = require("../repositories");
const { success } = require("../utils/response");
const { asyncHandler, BadRequestError, UnauthorizedError } = require("../errors");

const login = asyncHandler(async (req, res) => {
  const schema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError("Invalid login payload");
  }

  const user = await getUserByUsername(parsed.data.username);
  const isValidPassword = user ? await bcrypt.compare(parsed.data.password, user.password) : false;
  if (!user || !isValidPassword) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = createToken(user);
  const allowedMenus = await listMenuKeysForRoleName(user.role);
  return success(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      allowedMenus,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const { sub, name, username, role } = req.user;
  const allowedMenus = await listMenuKeysForRoleName(role);
  return success(res, { id: sub, name, username, role, allowedMenus });
});

module.exports = {
  login,
  me,
};
