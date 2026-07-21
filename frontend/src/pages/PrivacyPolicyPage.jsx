import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import "./LegalPage.css";

const UPDATED = "2026-07-20";
const CONTACT_EMAIL = "admin@dmscambodia.com";

export function PrivacyPolicyPage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t("legal.privacy.pageTitle");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("legal.privacy.metaDescription"));
    }
  }, [t, i18n.language]);

  return (
    <div className="legal-shell">
      <div className="legal-blob legal-blob--1" aria-hidden="true" />
      <div className="legal-blob legal-blob--2" aria-hidden="true" />

      <main className="legal-page">
        <article className="legal-card">
          <header className="legal-header">
            <span className="legal-brand" aria-hidden="true">
              DMS
            </span>
            <div className="legal-nav">
              <Link to="/terms">{t("legal.termsLink")}</Link>
              <Link to="/download-app">{t("legal.downloadLink")}</Link>
              <LanguageSwitcher className="lang-switcher--download" />
            </div>
          </header>

          <h1>{t("legal.privacy.title")}</h1>
          <p className="legal-updated">{t("legal.lastUpdated", { date: UPDATED })}</p>

          <p>{t("legal.privacy.intro")}</p>

          <h2>{t("legal.privacy.whoTitle")}</h2>
          <p>{t("legal.privacy.whoBody")}</p>

          <h2>{t("legal.privacy.dataTitle")}</h2>
          <ul>
            <li>{t("legal.privacy.dataAccount")}</li>
            <li>{t("legal.privacy.dataOrders")}</li>
            <li>{t("legal.privacy.dataLocation")}</li>
            <li>{t("legal.privacy.dataPayment")}</li>
            <li>{t("legal.privacy.dataDevice")}</li>
          </ul>

          <h2>{t("legal.privacy.useTitle")}</h2>
          <ul>
            <li>{t("legal.privacy.useAuth")}</li>
            <li>{t("legal.privacy.useFulfill")}</li>
            <li>{t("legal.privacy.useDispatch")}</li>
            <li>{t("legal.privacy.usePay")}</li>
            <li>{t("legal.privacy.useSupport")}</li>
          </ul>

          <h2>{t("legal.privacy.shareTitle")}</h2>
          <p>{t("legal.privacy.shareBody")}</p>

          <h2>{t("legal.privacy.retainTitle")}</h2>
          <p>{t("legal.privacy.retainBody")}</p>

          <h2>{t("legal.privacy.deleteTitle")}</h2>
          <p>{t("legal.privacy.deleteBody")}</p>

          <h2>{t("legal.privacy.securityTitle")}</h2>
          <p>{t("legal.privacy.securityBody")}</p>

          <h2>{t("legal.privacy.contactTitle")}</h2>
          <p>
            {t("legal.privacy.contactBody")}{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>

          <footer className="legal-footer">
            <Link to="/terms">{t("legal.termsLink")}</Link>
            <Link to="/download-app">{t("legal.downloadLink")}</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
