const crypto = require("crypto");

const USERNAME_PREFIXES = {
  Customer: "CUS",
  Depot: "DEP",
  Delivery: "DRV",
  Logistics: "LG",
};

const AUTO_CREDENTIAL_ROLES = new Set(Object.keys(USERNAME_PREFIXES));

const PAD_LENGTH = 4;

/**
 * Returns the prefix for a role, or null if the role does not use auto usernames.
 */
function rolePrefix(role) {
  return USERNAME_PREFIXES[role] || null;
}

function isAutoCredentialRole(role) {
  return AUTO_CREDENTIAL_ROLES.has(role);
}

/**
 * Format a username from a prefix and sequence number.
 * e.g. formatRoleUsername("CUS", 1) => "CUS0001"
 */
function formatRoleUsername(prefix, n) {
  return `${prefix}${String(n).padStart(PAD_LENGTH, "0")}`;
}

/**
 * Given an array of existing usernames and a role, returns the next username.
 * Scans existing usernames matching PREFIX#### and takes max + 1.
 */
function nextUsernameForRole(role, existingUsernames) {
  const prefix = rolePrefix(role);
  if (!prefix) return null;

  const re = new RegExp(`^${prefix}(\\d{${PAD_LENGTH},})$`, "i");
  let max = 0;
  for (const u of existingUsernames) {
    const m = re.exec(u);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return formatRoleUsername(prefix, max + 1);
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "#@!$%&*?";
const ALL_CHARS = UPPER + LOWER + DIGITS + SYMBOLS;

/**
 * Generate a random 12-character password with at least one uppercase,
 * one lowercase, one digit, and one symbol.
 * Uses crypto.randomBytes for cryptographic randomness.
 */
function generateRandomPassword() {
  const length = 12;

  function randomChar(charset) {
    const bytes = crypto.randomBytes(4);
    return charset[bytes.readUInt32BE(0) % charset.length];
  }

  const required = [
    randomChar(UPPER),
    randomChar(LOWER),
    randomChar(DIGITS),
    randomChar(SYMBOLS),
  ];

  const rest = Array.from({ length: length - required.length }, () =>
    randomChar(ALL_CHARS),
  );

  const combined = [...required, ...rest];

  // Shuffle using Fisher-Yates with crypto randomness
  for (let i = combined.length - 1; i > 0; i--) {
    const bytes = crypto.randomBytes(4);
    const j = bytes.readUInt32BE(0) % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join("");
}

module.exports = {
  isAutoCredentialRole,
  nextUsernameForRole,
  generateRandomPassword,
  formatRoleUsername,
  rolePrefix,
};
