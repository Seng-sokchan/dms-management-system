const jwt = require("jsonwebtoken");
const { listMenuKeysForRoleName, getUserById } = require("../repositories");
const { UnauthorizedError, ForbiddenError } = require("../errors");
const { fail } = require("../utils/response");

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

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return fail(res, { status: 401, code: "UNAUTHORIZED", message: "Missing bearer token" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const currentUser = await getUserById(decoded.sub);
    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid token" },
      });
    }
    req.user = {
      ...decoded,
      name: currentUser.name,
      username: currentUser.username,
      role: currentUser.role,
    };
    return next();
  } catch (_error) {
    return fail(res, { status: 401, code: "UNAUTHORIZED", message: "Invalid token" });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError("Unauthorized for this role"));
    }
    return next();
  };
}

function requireMenuKey(menuKey) {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Missing bearer token"));
    }
    try {
      const allowed = await listMenuKeysForRoleName(req.user.role);
      if (!allowed.includes(menuKey)) {
        return next(new ForbiddenError("Unauthorized menu access"));
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
