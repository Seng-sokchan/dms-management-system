const jwt = require("jsonwebtoken");
require("dotenv").config();
const { listMenuKeysForRoleName } = require("../db/dataStore");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  return process.env.JWT_SECRET;
}

function createToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role, username: user.username },
    getJwtSecret(),
    { expiresIn: "12h" },
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden for this role" });
    }
    return next();
  };
}

function requireMenuKey(menuKey) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Missing bearer token" });
    }
    try {
      const allowed = await listMenuKeysForRoleName(req.user.role);
      if (!allowed.includes(menuKey)) {
        return res.status(403).json({ message: "This menu is not enabled for your role" });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  createToken,
  requireAuth,
  requireRoles,
  requireMenuKey,
};
