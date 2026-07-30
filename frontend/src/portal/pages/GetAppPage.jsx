import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher";
import { detectMobilePlatform } from "../../utils/detectMobilePlatform";
import { getStoreUrlForPlatform } from "../../utils/storeLinks";
import "./GetAppPage.css";

export function GetAppPage({ user, onLogout }) {
  const { t } = useTranslation();
  const platform = useMemo(() => detectMobilePlatform(), []);
  const storeUrl = getStoreUrlForPlatform(platform);
  const isIos = platform === "ios";

  return (
    <div className="get-app">
      <main className="get-app__card">
        <header className="get-app__header">
          <LanguageSwitcher className="lang-switcher--get-app" />
        </header>

        <img
          className="get-app__logo"
          src="/logo.png"
          alt=""
          width={96}
          height={96}
        />
        <h1 className="get-app__title">{t("portal.getApp.title")}</h1>
        <p className="get-app__subtitle">
          {t("portal.getApp.subtitle", {
            name: user?.name || user?.username || t("portal.getApp.you"),
          })}
        </p>

        <div className="get-app__actions">
          {storeUrl ? (
            <a
              className="get-app__btn get-app__btn--primary"
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {isIos ? t("portal.getApp.openAppStore") : t("portal.getApp.openPlayStore")}
            </a>
          ) : null}
        </div>

        {onLogout ? (
          <button type="button" className="get-app__logout" onClick={onLogout}>
            {t("auth.signOut")}
          </button>
        ) : null}
      </main>
    </div>
  );
}
