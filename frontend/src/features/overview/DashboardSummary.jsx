import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./DashboardSummary.css";

const ORDER_STATUS_FALLBACK = [
  "Owner_Preparing",
  "Sent_To_Factory",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

export function DashboardSummary({ summary, statuses, isRefreshing = false }) {
  const { t } = useTranslation();

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      }),
    [],
  );
  const numberFormatter = useMemo(() => new Intl.NumberFormat(undefined), []);
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [],
  );
  const formatMoney = (value) => moneyFormatter.format(Number(value || 0));
  const formatKhr = (value) => numberFormatter.format(Number(value || 0));

  if (!summary) {
    return (
      <div className="summary-skeleton" role="status" aria-live="polite" aria-busy="true">
        <div className="skeleton-line" />
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  const { totals, statusSummary } = summary;
  const statusOptions = Array.isArray(statuses) && statuses.length ? statuses.map((row) => row.name) : ORDER_STATUS_FALLBACK;
  const orderStatusLabels = t("enums.orderStatus", { returnObjects: true });
  const totalOrders = Number(totals.orders || 0);
  const deliveredCount = Number(statusSummary?.Recieve_By_Customer || 0);
  const lifecycleProgressPct = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;
  const totalTrackedUnits = Number(totals.totalLossQty || 0) + Number(totals.totalRemainingQty || 0);
  const lossRatePct = totalTrackedUnits > 0 ? (Number(totals.totalLossQty || 0) / totalTrackedUnits) * 100 : 0;
  const discrepancyRatePct = totalTrackedUnits > 0 ? (Number(totals.totalDiscrepancy || 0) / totalTrackedUnits) * 100 : 0;
  const hasRiskyRates = lossRatePct >= 8 || discrepancyRatePct >= 8;

  return (
    <div className={`summary-grid ${isRefreshing ? "is-refreshing" : ""}`} aria-busy={isRefreshing}>
      <article className="stat-card stat-card--accent">
        <p className="stat-label">{t("dashboard.totalOrders")}</p>
        <p className="stat-value">{totals.orders}</p>
        <p className="stat-hint">{t("dashboard.totalOrdersHint")}</p>
      </article>
      <article className="stat-card stat-card--revenue">
        <p className="stat-label">{t("dashboard.revenue")}</p>
        <p className="stat-value stat-value--khr">
          <span className="stat-currency-mark" aria-hidden>
            ៛
          </span>
          {formatKhr(totals.totalRevenueKhr)}
        </p>
        <p className="stat-subvalue stat-subvalue--usd">
          <span className="stat-currency-mark" aria-hidden>
            $
          </span>
          {formatMoney(totals.totalRevenue)}
        </p>
        <p className="stat-hint">{t("dashboard.revenueHint")}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">{t("dashboard.lifecycleProgress")}</p>
        <p className="stat-value">{percentFormatter.format(lifecycleProgressPct)}%</p>
        <p className="stat-hint">
          {t("dashboard.lifecycleProgressHint", {
            delivered: deliveredCount,
            total: totalOrders,
          })}
        </p>
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

      <article className={`insight-card ${hasRiskyRates ? "insight-card--warning" : ""}`}>
        <h3 className="insight-title">{t("dashboard.deliveryNetwork")}</h3>
        <ul className="insight-list">
          <li>
            <span>{t("dashboard.discrepancy")}</span>
            <strong>{totals.totalDiscrepancy}</strong>
          </li>
          <li className={discrepancyRatePct >= 8 ? "is-warning" : ""}>
            <span>{t("dashboard.discrepancyRate")}</span>
            <strong>{percentFormatter.format(discrepancyRatePct)}%</strong>
          </li>
          <li>
            <span>{t("dashboard.lossUnits")}</span>
            <strong>{totals.totalLossQty ?? 0}</strong>
          </li>
          <li className={lossRatePct >= 8 ? "is-warning" : ""}>
            <span>{t("dashboard.lossRate")}</span>
            <strong>{percentFormatter.format(lossRatePct)}%</strong>
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
