const jwt = require("jsonwebtoken");
const { listMenuKeysForRoleName, listManageMenuKeysForRoleName, getUserById } = require("../repositories");
const { UnauthorizedError, ForbiddenError } = require("../errors");
const { fail } = require("../utils/response");
const { canSetStatus, getDataScope } = require("../services/rulesCache");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  return process.env.JWT_SECRET;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "365d";

function createToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role, username: user.username },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN },
  );
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, headerToken] = header.split(" ");
  const queryToken = typeof req.query?.token === "string" ? req.query.token.trim() : "";
  const token = headerToken || queryToken;

  if (!token) {
    return fail(res, { status: 401, code: "UNAUTHORIZED", message: "Missing bearer token" });
  }

  try {
    const session = await resolveAccessTokenSession(token);
    if (!session) {
      return fail(res, { status: 401, code: "UNAUTHORIZED", message: "Invalid token" });
    }
    if (session.inactive) {
      return fail(res, { status: 403, code: "ACCOUNT_INACTIVE", message: "Account is inactive" });
    }
    req.user = session.user;
    return next();
  } catch (_error) {
    return fail(res, { status: 401, code: "UNAUTHORIZED", message: "Invalid token" });
  }
}

function requireDataScope(...scopes) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError("Unauthorized"));
    }
    const scope = getDataScope(req.user.role);
    if (!scopes.includes(scope)) {
      return next(new ForbiddenError("Unauthorized for this data scope"));
    }
    return next();
  };
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError("Unauthorized for this role"));
    }
    return next();
  };
}

function requireMenuKey(menuKey, { client = "admin", requireManage = false } = {}) {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Missing bearer token"));
    }
    try {
      const listFn = requireManage ? listManageMenuKeysForRoleName : listMenuKeysForRoleName;
      const allowed = await listFn(req.user.role, { client });
      if (!allowed.includes(menuKey)) {
        return next(new ForbiddenError("Unauthorized menu access"));
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function requireManageMenuKey(menuKey, options = {}) {
  return requireMenuKey(menuKey, { ...options, requireManage: true });
}

function requireStatusPermission(action = "update_status") {
  return (req, res, next) => {
    const nextStatus = req.body?.status || req.body?.nextStatus || req.params?.status;
    if (!req.user) {
      return next(new UnauthorizedError("Missing bearer token"));
    }
    if (!nextStatus || !canSetStatus(req.user.role, nextStatus, action)) {
      return next(new ForbiddenError("Unauthorized to set this status"));
    }
    return next();
  };
}

async function resolveAccessTokenSession(token) {
  if (typeof token !== "string") return null;
  const trimmed = token.trim();
  if (!trimmed) return null;
  try {
    const decoded = jwt.verify(trimmed, getJwtSecret());
    const currentUser = await getUserById(decoded.sub);
    if (!currentUser) return null;
    if (!currentUser.isActive) return { inactive: true };
    return {
      user: {
        ...decoded,
        sub: String(currentUser.id),
        name: currentUser.name,
        username: currentUser.username,
        role: currentUser.role,
        isActive: true,
        deliveryAgentId:
          currentUser.deliveryAgentId != null && String(currentUser.deliveryAgentId).trim() !== ""
            ? String(currentUser.deliveryAgentId)
            : "",
      },
    };
  } catch (_error) {
    return null;
  }
}

async function resolveUserFromAccessToken(token) {
  const session = await resolveAccessTokenSession(token);
  return session?.user ?? null;
}

module.exports = {
  createToken,
  requireAuth,
  requireRoles,
  requireDataScope,
  requireMenuKey,
  requireManageMenuKey,
  requireStatusPermission,
  resolveUserFromAccessToken,
  resolveAccessTokenSession,
};
