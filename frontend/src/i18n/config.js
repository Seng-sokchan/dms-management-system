import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../locales/en.json";
import km from "../locales/km.json";

/** Same key the browser language detector uses for `localStorage` (persists after refresh). */
export const LANG_STORAGE_KEY = "fix-asset-lang";

function applyDomLanguage(lng) {
  if (typeof document === "undefined") return;
  const raw = String(lng || "en");
  const code = raw.toLowerCase().split("-")[0] === "km" ? "km" : "en";
  document.documentElement.lang = code;
  document.documentElement.classList.toggle("lang-km", code === "km");
}

function tryPersistLanguage(lng) {
  if (typeof localStorage === "undefined") return;
  const code = String(lng).toLowerCase().split("-")[0];
  if (code !== "en" && code !== "km") return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, code);
  } catch {
    /* quota / private mode */
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      km: { translation: km },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "km"],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

i18n.on("initialized", () => {
  applyDomLanguage(i18n.language);
});

i18n.on("languageChanged", (lng) => {
  tryPersistLanguage(lng);
  applyDomLanguage(lng);
});

export default i18n;
