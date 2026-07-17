const USERNAME_PREFIXES = {
  Customer: "CUS",
  Depot: "DEP",
  Delivery: "DRV",
  Logistics: "LG",
};

const AUTO_CREDENTIAL_ROLES = new Set(Object.keys(USERNAME_PREFIXES));

const PAD_LENGTH = 4;

export function isAutoCredentialRole(role) {
  return AUTO_CREDENTIAL_ROLES.has(role);
}

export function rolePrefix(role) {
  return USERNAME_PREFIXES[role] || null;
}

export function formatRoleUsername(prefix, n) {
  return `${prefix}${String(n).padStart(PAD_LENGTH, "0")}`;
}

/**
 * Given the current users list and a role, predict the next username.
 * Mirrors backend logic so the form can show a preview before submitting.
 */
export function nextUsernameForRole(role, users) {
  const prefix = rolePrefix(role);
  if (!prefix) return "";
  const re = new RegExp(`^${prefix}(\\d{${PAD_LENGTH},})$`, "i");
  let max = 0;
  for (const u of users) {
    const m = re.exec(u.username || "");
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

function randomChar(charset) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return charset[arr[0] % charset.length];
}

export function generateRandomPassword() {
  const length = 12;
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

  for (let i = combined.length - 1; i > 0; i--) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const j = arr[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}
