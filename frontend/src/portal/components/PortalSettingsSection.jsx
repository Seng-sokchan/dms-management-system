import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePortalPreferences } from "../context/PortalPreferencesContext";

const THEME_OPTIONS = [
  { id: "light", labelKey: "portal.settings.themeLight" },
  { id: "dark", labelKey: "portal.settings.themeDark" },
  { id: "system", labelKey: "portal.settings.themeSystem" },
];

const FONT_SIZE_OPTIONS = [
  { id: "small", labelKey: "portal.settings.fontSizeSmall" },
  { id: "medium", labelKey: "portal.settings.fontSizeMedium" },
  { id: "big", labelKey: "portal.settings.fontSizeBig" },
];

const LANG_OPTIONS = [
  { id: "en", labelKey: "language.en" },
  { id: "km", labelKey: "language.km" },
];

function OptionRow({ label, selected, onClick }) {
  return (
    <button
      type="button"
      className={`portal-settings__option${selected ? " is-selected" : ""}`}
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      aria-label={label}
    >
      <span>{label}</span>
      {selected ? <span className="portal-settings__check" aria-hidden>✓</span> : null}
    </button>
  );
}

/**
 * Settings card: theme, font size, language, legal (mirrors mobile SettingsSection).
 */
export function PortalSettingsSection() {
  const { t, i18n } = useTranslation();
  const {
    themePreference,
    setThemePreference,
    fontSizePreference,
    setFontSizePreference,
  } = usePortalPreferences();
  const currentLang = i18n.language?.startsWith("km") ? "km" : "en";

  return (
    <article className="portal-card portal-settings">
      <h3 className="portal-settings__title">{t("portal.settings.title")}</h3>

      <p className="portal-settings__label">{t("portal.settings.theme")}</p>
      <div className="portal-settings__pills" role="radiogroup" aria-label={t("portal.settings.theme")}>
        {THEME_OPTIONS.map((opt) => {
          const active = themePreference === opt.id;
          const label = t(opt.labelKey);
          return (
            <button
              key={opt.id}
              type="button"
              className={`portal-settings__pill${active ? " is-active" : ""}`}
              onClick={() => setThemePreference(opt.id)}
              role="radio"
              aria-checked={active}
              aria-label={label}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className="portal-settings__label">{t("portal.settings.fontSize")}</p>
      <div className="portal-settings__pills" role="radiogroup" aria-label={t("portal.settings.fontSize")}>
        {FONT_SIZE_OPTIONS.map((opt) => {
          const active = fontSizePreference === opt.id;
          const label = t(opt.labelKey);
          return (
            <button
              key={opt.id}
              type="button"
              className={`portal-settings__pill${active ? " is-active" : ""}`}
              onClick={() => setFontSizePreference(opt.id)}
              role="radio"
              aria-checked={active}
              aria-label={label}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className="portal-settings__label">{t("portal.settings.language")}</p>
      {LANG_OPTIONS.map((opt) => (
        <OptionRow
          key={opt.id}
          label={t(opt.labelKey)}
          selected={currentLang === opt.id}
          onClick={() => void i18n.changeLanguage(opt.id)}
        />
      ))}

      <p className="portal-settings__label portal-settings__label--spaced">
        {t("portal.settings.legal")}
      </p>
      <Link to="/privacy" className="portal-settings__link" target="_blank" rel="noopener noreferrer">
        {t("portal.settings.privacyPolicy")}
      </Link>
      <Link to="/terms" className="portal-settings__link" target="_blank" rel="noopener noreferrer">
        {t("portal.settings.termsOfService")}
      </Link>
    </article>
  );
}
