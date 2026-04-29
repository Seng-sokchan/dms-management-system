/**
 * Data transfer objects for the User resource.
 * Use these when sending user data to clients so internal-only fields
 * (password hash, internal flags, etc.) never leak.
 */

/**
 * Public user shape, safe to return from any endpoint.
 */
function toUserDto(user, { allowedMenus } = {}) {
  if (!user) return null;
  const dto = {
    id: user.id ?? user.sub,
    name: user.name,
    username: user.username,
    role: user.role,
  };
  if (Array.isArray(allowedMenus)) dto.allowedMenus = allowedMenus;
  return dto;
}

/**
 * Auth response shape returned from POST /auth/login.
 */
function toAuthDto({ token, user, allowedMenus }) {
  return {
    token,
    user: toUserDto(user, { allowedMenus }),
  };
}

module.exports = { toUserDto, toAuthDto };
