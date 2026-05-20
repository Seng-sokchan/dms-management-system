import { useTranslation } from "react-i18next";

/**
 * Full-screen loading state shown only while the first dashboard fetch
 * completes after login or when restoring a stored session.
 */
export function DashboardBootstrapScreen() {
  const { t } = useTranslation();

  return (
    <div className="app-bootstrap" role="status" aria-live="polite" aria-busy="true">
      <div className="app-bootstrap__card">
        <div className="app-bootstrap__mark" aria-hidden>
          DMS
        </div>
        <div className="app-bootstrap__spinner" aria-hidden />
        <p className="app-bootstrap__title">{t("app.loadingTitle")}</p>
        <p className="app-bootstrap__hint">{t("app.loadingHint")}</p>
      </div>
    </div>
  );
}
