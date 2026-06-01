import { useTranslation } from "react-i18next";
import { DashboardSummary } from "../features/overview/DashboardSummary";

export function OverviewPage({ summary, statuses, isRefreshing = false, lastUpdatedAt = null }) {
  const { t } = useTranslation();
  const lastUpdatedText = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString()
    : t("overview.lastUpdatedFallback");

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("overview.title")}</h2>
        <p className="section-lead">{t("overview.lead")}</p>
        <p className="section-lead" aria-live="polite">
          {isRefreshing
            ? t("overview.refreshing", { lastUpdated: lastUpdatedText })
            : t("overview.lastUpdated", { time: lastUpdatedText })}
        </p>
      </div>
      <DashboardSummary summary={summary} statuses={statuses} isRefreshing={isRefreshing} />
    </section>
  );
}
