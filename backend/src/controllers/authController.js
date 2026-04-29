const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { createToken } = require("../middleware/auth");
const { getUserByUsername, listMenuKeysForRoleName } = require("../repositories");

async function login(req, res) {
  const schema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid login payload" });
  }

  const user = await getUserByUsername(parsed.data.username);
  if (!user || !bcrypt.compareSync(parsed.data.password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = createToken(user);
  const allowedMenus = await listMenuKeysForRoleName(user.role);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      allowedMenus,
    },
  });
}

async function me(req, res, next) {
  try {
    const { sub, name, username, role } = req.user;
    const allowedMenus = await listMenuKeysForRoleName(role);
    return res.json({ id: sub, name, username, role, allowedMenus });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  me,
};
