import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import km from "../locales/km.json";
import { getLanguagePreference, LANG_STORAGE_KEY, setLanguagePreference } from "../services/preferencesStorage";

export { LANG_STORAGE_KEY };

let initialized = false;

export async function initI18n(language) {
  const lng = language === "km" ? "km" : "en";
  if (!initialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        km: { translation: km },
      },
      lng,
      fallbackLng: "en",
      supportedLngs: ["en", "km"],
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    initialized = true;
    return i18n;
  }
  if (i18n.language !== lng) {
    await i18n.changeLanguage(lng);
  }
  return i18n;
}

export async function bootstrapI18n() {
  const saved = await getLanguagePreference();
  return initI18n(saved);
}

export async function changeAppLanguage(code) {
  const lng = code === "km" ? "km" : "en";
  await setLanguagePreference(lng);
  await i18n.changeLanguage(lng);
}

export function getAppLocale(language) {
  return language === "km" || String(language || "").startsWith("km") ? "km-KH" : "en-US";
}

export default i18n;
