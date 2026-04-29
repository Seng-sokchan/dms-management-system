import { useTranslation } from "react-i18next";
import { DashboardSummary } from "../features/overview/DashboardSummary";

export function OverviewPage({ summary, statuses }) {
  const { t } = useTranslation();
  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("overview.title")}</h2>
        <p className="section-lead">{t("overview.lead")}</p>
      </div>
      <DashboardSummary summary={summary} statuses={statuses} />
    </section>
  );
}
