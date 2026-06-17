import AsyncStorage from "@react-native-async-storage/async-storage";

export const THEME_STORAGE_KEY = "fix-asset-theme";
export const LANG_STORAGE_KEY = "fix-asset-lang";
export const USERNAME_STORAGE_KEY = "dms-remembered-username";

const VALID_THEMES = new Set(["light", "dark", "system"]);
const VALID_LANGS = new Set(["en", "km"]);

export async function getThemePreference() {
  try {
    const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (raw && VALID_THEMES.has(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

export async function setThemePreference(preference) {
  if (!VALID_THEMES.has(preference)) return;
  await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
}

export async function getLanguagePreference() {
  try {
    const raw = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (raw && VALID_LANGS.has(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

export async function setLanguagePreference(language) {
  if (!VALID_LANGS.has(language)) return;
  await AsyncStorage.setItem(LANG_STORAGE_KEY, language);
}

export async function getRememberedUsername() {
  try {
    return (await AsyncStorage.getItem(USERNAME_STORAGE_KEY)) || "";
  } catch {
    return "";
  }
}

export async function setRememberedUsername(username) {
  const value = typeof username === "string" ? username.trim() : "";
  if (!value) {
    await AsyncStorage.removeItem(USERNAME_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(USERNAME_STORAGE_KEY, value);
}
