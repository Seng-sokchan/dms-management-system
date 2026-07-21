import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import "./DownloadAppPage.css";

const APP_VERSION =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_MOBILE_APP_VERSION
    ? String(import.meta.env.VITE_MOBILE_APP_VERSION).trim()
    : "") || "0.0.1";

const APK_URL = "/app.apk";

function AndroidBadgeIcon() {
  return (
    <svg className="download-app-badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a9.86 9.86 0 0 0-4.94 0L9.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18a8.977 8.977 0 0 0-3.47 3.47L3.54 17.4c-.31.16-.48.52-.37.85.11.33.42.55.76.55h16.14c.34 0 .65-.22.76-.55.11-.33-.06-.69-.37-.85l-3.18-1.84a8.977 8.977 0 0 0-3.46-3.47zM12 17.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="download-app-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  );
}

export function DownloadAppPage() {
  const { t, i18n } = useTranslation();
  const [apkReady, setApkReady] = useState(null);

  useEffect(() => {
    document.title = t("downloadApp.pageTitle");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("downloadApp.metaDescription"));
    }
  }, [t, i18n.language]);

  useEffect(() => {
    let cancelled = false;
    fetch(APK_URL, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setApkReady(res.ok);
      })
      .catch(() => {
        if (!cancelled) setApkReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const steps = ["step1", "step2", "step3", "step4"];

  return (
    <div className="download-app-shell">
      <div className="download-app-blob download-app-blob--1" aria-hidden="true" />
      <div className="download-app-blob download-app-blob--2" aria-hidden="true" />

      <main className="download-app-page">
        <article className="download-app-card">
          <header className="download-app-card-header">
            <span className="download-app-brand" aria-hidden="true">
              DMS
            </span>
            <LanguageSwitcher className="lang-switcher--download" />
          </header>

          <section className="download-app-hero">
            <div className="download-app-icon-wrap">
              <img
                className="download-app-icon"
                src="/dms-mobile-icon.png"
                alt={t("downloadApp.iconAlt")}
                width={88}
                height={88}
              />
            </div>
            <h1>{t("downloadApp.title")}</h1>
            <p className="download-app-subtitle">{t("downloadApp.subtitle")}</p>
            <div className="download-app-meta">
              <span className="download-app-badge download-app-badge--version">
                {t("downloadApp.version", { version: APP_VERSION })}
              </span>
              <span className="download-app-badge download-app-badge--platform">
                <AndroidBadgeIcon />
                <span>{t("downloadApp.platform")}</span>
              </span>
            </div>
          </section>

          <a
            className={`download-app-btn${apkReady === false ? " download-app-btn--disabled" : ""}`}
            href={apkReady === false ? undefined : APK_URL}
            download={apkReady !== false ? "" : undefined}
            aria-disabled={apkReady === false ? "true" : undefined}
            onClick={apkReady === false ? (e) => e.preventDefault() : undefined}
          >
            <DownloadIcon />
            <span>{t("downloadApp.download")}</span>
          </a>

          <section className="download-app-steps" aria-labelledby="download-app-install-heading">
            <h2 id="download-app-install-heading">{t("downloadApp.installHeading")}</h2>
            <ol className="download-app-steps-list">
              {steps.map((key, index) => (
                <li key={key} className="download-app-step">
                  <span className="download-app-step-num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="download-app-step-text">
                    <Trans i18nKey={`downloadApp.${key}`} components={{ strong: <strong /> }} />
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {apkReady === false ? (
            <p className="download-app-note">
              <Trans i18nKey="downloadApp.note" components={{ code: <code /> }} />
            </p>
          ) : null}

          <footer className="download-app-legal">
            <Link to="/privacy">{t("legal.privacyLink")}</Link>
            <Link to="/terms">{t("legal.termsLink")}</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
