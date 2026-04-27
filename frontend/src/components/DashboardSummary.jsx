import { useTranslation } from "react-i18next";
import { ORDER_STATUS, PAYMENT_STATUS } from "../services/adminApi";

export function DashboardSummary({ summary, statuses }) {
  const { t } = useTranslation();

  if (!summary) {
    return (
      <div className="summary-skeleton" aria-hidden>
        <div className="skeleton-line" />
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  const { totals, statusSummary, paymentSummary } = summary;
  const statusOptions = Array.isArray(statuses) && statuses.length ? statuses.map((row) => row.name) : ORDER_STATUS;
  const orderStatusLabels = t("enums.orderStatus", { returnObjects: true });
  const paymentStatusLabels = t("enums.paymentStatus", { returnObjects: true });

  return (
    <div className="summary-grid">
      <article className="stat-card stat-card--accent">
        <p className="stat-label">{t("dashboard.totalOrders")}</p>
        <p className="stat-value">{totals.orders}</p>
        <p className="stat-hint">{t("dashboard.totalOrdersHint")}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">{t("dashboard.revenue")}</p>
        <p className="stat-value">${totals.totalRevenue}</p>
        <p className="stat-hint">{t("dashboard.revenueHint")}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">{t("dashboard.collected")}</p>
        <p className="stat-value stat-value--ok">${totals.totalCollected}</p>
        <p className="stat-hint">{t("dashboard.collectedHint")}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">{t("dashboard.outstanding")}</p>
        <p className="stat-value stat-value--warn">${totals.outstandingBalance}</p>
        <p className="stat-hint">{t("dashboard.outstandingHint")}</p>
      </article>

      {statusSummary ? (
        <article className="insight-card">
          <h3 className="insight-title">{t("dashboard.byStatus")}</h3>
          <ul className="insight-list insight-list--compact">
            {statusOptions.map((s) => (
              <li key={s}>
                <span>{typeof orderStatusLabels === "object" && orderStatusLabels?.[s] ? orderStatusLabels[s] : s}</span>
                <strong>{statusSummary[s] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {paymentSummary ? (
        <article className="insight-card">
          <h3 className="insight-title">{t("dashboard.byPayment")}</h3>
          <ul className="insight-list insight-list--compact">
            {PAYMENT_STATUS.map((s) => (
              <li key={s}>
                <span>
                  {typeof paymentStatusLabels === "object" && paymentStatusLabels?.[s] ? paymentStatusLabels[s] : s}
                </span>
                <strong>{paymentSummary[s] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      <article className="insight-card">
        <h3 className="insight-title">{t("dashboard.deliveryNetwork")}</h3>
        <ul className="insight-list">
          <li>
            <span>{t("dashboard.discrepancy")}</span>
            <strong>{totals.totalDiscrepancy}</strong>
          </li>
          <li>
            <span>{t("dashboard.lossUnits")}</span>
            <strong>{totals.totalLossQty ?? 0}</strong>
          </li>
          <li>
            <span>{t("dashboard.remainingUnits")}</span>
            <strong>{totals.totalRemainingQty ?? 0}</strong>
          </li>
          <li>
            <span>{t("dashboard.agentCount")}</span>
            <strong>{totals.deliveryAgents}</strong>
          </li>
          <li>
            <span>{t("dashboard.producerCount")}</span>
            <strong>{totals.producers}</strong>
          </li>
        </ul>
      </article>
    </div>
  );
}
