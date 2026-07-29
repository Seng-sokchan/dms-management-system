const THEME_KEY = "portal-theme-preference";
const FONT_KEY = "portal-font-size-preference";

export const THEME_OPTIONS = ["light", "dark", "system"];
export const FONT_SIZE_OPTIONS = ["small", "medium", "big"];

function readKey(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (allowed.includes(value)) return value;
  } catch {
    /* private mode */
  }
  return fallback;
}

export function getStoredThemePreference() {
  return readKey(THEME_KEY, THEME_OPTIONS, "system");
}

export function getStoredFontSizePreference() {
  return readKey(FONT_KEY, FONT_SIZE_OPTIONS, "medium");
}

export function setStoredThemePreference(value) {
  if (!THEME_OPTIONS.includes(value)) return;
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    /* private mode */
  }
}

export function setStoredFontSizePreference(value) {
  if (!FONT_SIZE_OPTIONS.includes(value)) return;
  try {
    localStorage.setItem(FONT_KEY, value);
  } catch {
    /* private mode */
  }
}

export function resolveTheme(preference) {
  if (preference === "light" || preference === "dark") return preference;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}
