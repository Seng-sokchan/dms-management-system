import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import "./LegalPage.css";

const UPDATED = "2026-07-20";
const CONTACT_EMAIL = "admin@dmscambodia.com";

export function TermsOfServicePage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t("legal.terms.pageTitle");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("legal.terms.metaDescription"));
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
              <Link to="/privacy">{t("legal.privacyLink")}</Link>
              <Link to="/download-app">{t("legal.downloadLink")}</Link>
              <LanguageSwitcher className="lang-switcher--download" />
            </div>
          </header>

          <h1>{t("legal.terms.title")}</h1>
          <p className="legal-updated">{t("legal.lastUpdated", { date: UPDATED })}</p>

          <p>{t("legal.terms.intro")}</p>

          <h2>{t("legal.terms.serviceTitle")}</h2>
          <p>{t("legal.terms.serviceBody")}</p>

          <h2>{t("legal.terms.accountsTitle")}</h2>
          <p>{t("legal.terms.accountsBody")}</p>

          <h2>{t("legal.terms.ordersTitle")}</h2>
          <p>{t("legal.terms.ordersBody")}</p>

          <h2>{t("legal.terms.locationTitle")}</h2>
          <p>{t("legal.terms.locationBody")}</p>

          <h2>{t("legal.terms.acceptableTitle")}</h2>
          <ul>
            <li>{t("legal.terms.acceptable1")}</li>
            <li>{t("legal.terms.acceptable2")}</li>
            <li>{t("legal.terms.acceptable3")}</li>
          </ul>

          <h2>{t("legal.terms.liabilityTitle")}</h2>
          <p>{t("legal.terms.liabilityBody")}</p>

          <h2>{t("legal.terms.changesTitle")}</h2>
          <p>{t("legal.terms.changesBody")}</p>

          <h2>{t("legal.terms.contactTitle")}</h2>
          <p>
            {t("legal.terms.contactBody")}{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>

          <footer className="legal-footer">
            <Link to="/privacy">{t("legal.privacyLink")}</Link>
            <Link to="/download-app">{t("legal.downloadLink")}</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
