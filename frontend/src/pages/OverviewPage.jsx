import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { DashboardSummary } from "../features/overview/DashboardSummary";
import "./OverviewPage.css";

export function OverviewPage({
  summary,
  statuses,
  isRefreshing = false,
  lastUpdatedAt = null,
  onRefresh,
}) {
  const { t } = useTranslation();
  const lastUpdatedText = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString()
    : t("overview.lastUpdatedFallback");

  return (
    <section className="admin-page">
      <div className="overview-header">
        <div className="section-heading overview-header-text">
          <h2>{t("overview.title")}</h2>
          <p className="section-lead">{t("overview.lead")}</p>
        </div>
        <div className="overview-header-actions">
          {typeof onRefresh === "function" ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void onRefresh()}
              disabled={isRefreshing}
              aria-busy={isRefreshing}
            >
              {isRefreshing ? t("overview.refreshingAction") : t("overview.refresh")}
            </Button>
          ) : null}
          <p className="overview-updated" aria-live="polite">
            {isRefreshing
              ? t("overview.refreshing", { lastUpdated: lastUpdatedText })
              : t("overview.lastUpdated", { time: lastUpdatedText })}
          </p>
        </div>
      </div>
      <DashboardSummary summary={summary} statuses={statuses} isRefreshing={isRefreshing} />
    </section>
  );
}
