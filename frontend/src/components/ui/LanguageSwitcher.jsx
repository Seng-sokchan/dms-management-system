import { useTranslation } from "react-i18next";
import { LANG_STORAGE_KEY } from "../../i18n/config";

const LANGS = [
  { code: "en", labelKey: "language.en", flag: "/flags/us.svg" },
  { code: "km", labelKey: "language.km", flag: "/flags/kh.svg" },
];

export function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage?.startsWith("km") ? "km" : "en";
  const active = LANGS.find((l) => l.code === current) || LANGS[0];
  const other = current === "en" ? "km" : "en";
  const otherItem = LANGS.find((l) => l.code === other);
  const otherName = otherItem ? t(otherItem.labelKey) : "";
  const switchHint = t("language.switchTo", { name: otherName });

  return (
    <div className={`lang-switcher lang-switcher--single ${className}`.trim()}>
      <button
        type="button"
        className="lang-switcher-btn lang-switcher-btn--solo is-active"
        onClick={() => {
          try {
            localStorage.setItem(LANG_STORAGE_KEY, other);
          } catch {
            /* ignore */
          }
          void i18n.changeLanguage(other);
        }}
        title={switchHint}
        aria-label={switchHint}
      >
        <img
          className="lang-switcher-ico"
          src={active.flag}
          width="22"
          height="16"
          alt=""
          decoding="async"
          loading="eager"
        />
      </button>
    </div>
  );
}
