const bcrypt = require("bcryptjs");
const { createToken } = require("../middleware/auth");
const { getUserByUsername, listMenuKeysForRoleName } = require("../repositories");
const { UnauthorizedError } = require("../errors");

async function login({ username, password }) {
  const user = await getUserByUsername(username);
  const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !isValidPassword) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = createToken(user);
  const allowedMenus = await listMenuKeysForRoleName(user.role);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      allowedMenus,
    },
  };
}

async function me(currentUser) {
  const allowedMenus = await listMenuKeysForRoleName(currentUser.role);
  return {
    id: currentUser.sub,
    name: currentUser.name,
    username: currentUser.username,
    role: currentUser.role,
    allowedMenus,
  };
}

module.exports = {
  login,
  me,
};
