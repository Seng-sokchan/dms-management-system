import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./DashboardSummary.css";

const ORDER_STATUS_FALLBACK = [
  "Owner_Preparing",
  "Sent_To_Factory",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

function useFormatters() {
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

  return {
    formatMoney: (value) => moneyFormatter.format(Number(value || 0)),
    formatKhr: (value) => numberFormatter.format(Number(value || 0)),
    formatNumber: (value) => numberFormatter.format(Number(value || 0)),
    formatPercent: (value) => percentFormatter.format(Number(value || 0)),
  };
}

function MoneyValue({ khr, usd, formatKhr, formatMoney }) {
  return (
    <>
      <p className="kpi-value kpi-value--khr">
        <span className="kpi-currency" aria-hidden>
          ៛
        </span>
        {formatKhr(khr)}
      </p>
      <p className="kpi-subvalue kpi-subvalue--usd">
        <span className="kpi-currency" aria-hidden>
          $
        </span>
        {formatMoney(usd)}
      </p>
    </>
  );
}

function KpiRow({ totals, t, formatKhr, formatMoney, formatNumber }) {
  return (
    <section className="dashboard-section" aria-labelledby="dashboard-at-a-glance">
      <h3 id="dashboard-at-a-glance" className="dashboard-section-title">
        {t("dashboard.sections.atAGlance")}
      </h3>
      <div className="kpi-grid">
        <article className="kpi-card kpi-card--orders">
          <p className="kpi-label">{t("dashboard.totalOrders")}</p>
          <p className="kpi-value">{formatNumber(totals.orders)}</p>
          <p className="kpi-hint">{t("dashboard.totalOrdersHint")}</p>
        </article>
        <article className="kpi-card kpi-card--revenue">
          <p className="kpi-label">{t("dashboard.revenue")}</p>
          <MoneyValue
            khr={totals.totalRevenueKhr}
            usd={totals.totalRevenue}
            formatKhr={formatKhr}
            formatMoney={formatMoney}
          />
          <p className="kpi-hint">{t("dashboard.revenueHint")}</p>
        </article>
        <article className="kpi-card kpi-card--collected">
          <p className="kpi-label">{t("dashboard.collected")}</p>
          <MoneyValue
            khr={totals.totalCollectedKhr}
            usd={totals.totalCollected}
            formatKhr={formatKhr}
            formatMoney={formatMoney}
          />
          <p className="kpi-hint">{t("dashboard.collectedHint")}</p>
        </article>
        <article className="kpi-card kpi-card--outstanding">
          <p className="kpi-label">{t("dashboard.outstanding")}</p>
          <MoneyValue
            khr={totals.outstandingBalanceKhr}
            usd={totals.outstandingBalance}
            formatKhr={formatKhr}
            formatMoney={formatMoney}
          />
          <p className="kpi-hint">{t("dashboard.outstandingHint")}</p>
        </article>
      </div>
    </section>
  );
}

function CollectionHealth({ totals, t, formatPercent }) {
  const revenueKhr = Number(totals.totalRevenueKhr || 0);
  const collectedKhr = Number(totals.totalCollectedKhr || 0);
  const collectionRatePct = revenueKhr > 0 ? (collectedKhr / revenueKhr) * 100 : 0;
  const barWidth = Math.min(Math.max(collectionRatePct, 0), 100);

  return (
    <section className="dashboard-section" aria-labelledby="dashboard-collection">
      <h3 id="dashboard-collection" className="dashboard-section-title">
        {t("dashboard.sections.collection")}
      </h3>
      <article className="collection-card">
        <div className="collection-header">
          <div>
            <p className="collection-label">{t("dashboard.collectionRate")}</p>
            <p className="collection-value">{formatPercent(collectionRatePct)}%</p>
          </div>
          <p className="collection-hint">{t("dashboard.collectionRateHint")}</p>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(barWidth)}
          aria-label={t("dashboard.collectionRate")}
        >
          <div className="progress-fill" style={{ width: `${barWidth}%` }} />
        </div>
      </article>
    </section>
  );
}

function OrderPipeline({ statusSummary, statuses, totalOrders, t, formatNumber, formatPercent }) {
  const statusOptions =
    Array.isArray(statuses) && statuses.length ? statuses.map((row) => row.name) : ORDER_STATUS_FALLBACK;
  const orderStatusLabels = t("enums.orderStatus", { returnObjects: true });
  const deliveredCount = Number(statusSummary?.Recieve_By_Customer || 0);
  const lifecycleProgressPct = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;

  const statusLabel = (status) =>
    typeof orderStatusLabels === "object" && orderStatusLabels?.[status] ? orderStatusLabels[status] : status;

  return (
    <section className="dashboard-section dashboard-section--panel" aria-labelledby="dashboard-pipeline">
      <div className="dashboard-section-head">
        <h3 id="dashboard-pipeline" className="dashboard-section-title">
          {t("dashboard.sections.pipeline")}
        </h3>
        <p className="dashboard-section-subtitle">
          {t("dashboard.lifecycleProgressHint", { delivered: deliveredCount, total: totalOrders })}
          {" · "}
          {formatPercent(lifecycleProgressPct)}%
        </p>
      </div>
      {statusSummary ? (
        <>
          <ol className="pipeline-stepper" aria-label={t("dashboard.byStatus")}>
            {statusOptions.map((status, index) => {
              const count = Number(statusSummary[status] ?? 0);
              const isComplete = totalOrders > 0 && count > 0 && index < statusOptions.length - 1;
              const isActive = count > 0;
              return (
                <li
                  key={status}
                  className={`pipeline-step${isActive ? " is-active" : ""}${isComplete ? " is-complete" : ""}`}
                >
                  <span className="pipeline-step-dot" aria-hidden />
                  <span className="pipeline-step-label">{statusLabel(status)}</span>
                  <strong className="pipeline-step-count">{formatNumber(count)}</strong>
                </li>
              );
            })}
          </ol>
          <ul className="status-bar-list">
            {statusOptions.map((status) => {
              const count = Number(statusSummary[status] ?? 0);
              const widthPct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
              return (
                <li key={status} className="status-bar-row">
                  <div className="status-bar-meta">
                    <span>{statusLabel(status)}</span>
                    <strong>{formatNumber(count)}</strong>
                  </div>
                  <div className="status-bar-track" aria-hidden>
                    <div className="status-bar-fill" style={{ width: `${widthPct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function FulfillmentNetwork({ totals, t, formatNumber, formatPercent }) {
  const orderedUnits = Number(totals.totalOrderedQty || 0);
  const deliveredUnits = Number(totals.totalDeliveredQty || 0);
  const lossUnits = Number(totals.totalLossQty || 0);
  const undeliveredUnits = Number(totals.totalRemainingQty || 0);
  const trackedUnits = deliveredUnits + lossUnits + undeliveredUnits;
  const fulfillmentRatePct = orderedUnits > 0 ? (deliveredUnits / orderedUnits) * 100 : 0;
  const lossRatePct = trackedUnits > 0 ? (lossUnits / trackedUnits) * 100 : 0;
  const hasRiskyLoss = lossRatePct >= 8;

  return (
    <section
      className={`dashboard-section dashboard-section--panel${hasRiskyLoss ? " dashboard-section--warning" : ""}`}
      aria-labelledby="dashboard-fulfillment"
    >
      <div className="dashboard-section-head">
        <h3 id="dashboard-fulfillment" className="dashboard-section-title">
          {t("dashboard.sections.fulfillment")}
        </h3>
        <p className="dashboard-section-subtitle">
          {t("dashboard.fulfillmentRate")}: {formatPercent(fulfillmentRatePct)}%
        </p>
      </div>
      <ul className="metric-grid">
        <li>
          <span>{t("dashboard.orderedUnits")}</span>
          <strong>{formatNumber(orderedUnits)}</strong>
        </li>
        <li>
          <span>{t("dashboard.deliveredUnits")}</span>
          <strong>{formatNumber(deliveredUnits)}</strong>
        </li>
        <li>
          <span>{t("dashboard.lossUnits")}</span>
          <strong>{formatNumber(lossUnits)}</strong>
        </li>
        <li className={hasRiskyLoss ? "is-warning" : ""}>
          <span>{t("dashboard.lossRate")}</span>
          <strong>{formatPercent(lossRatePct)}%</strong>
        </li>
        <li>
          <span>{t("dashboard.undeliveredUnits")}</span>
          <strong>{formatNumber(undeliveredUnits)}</strong>
        </li>
      </ul>
      <div className="network-row">
        <span className="network-chip">
          {t("dashboard.agentCount")}: <strong>{formatNumber(totals.deliveryAgents)}</strong>
        </span>
        <span className="network-chip">
          {t("dashboard.producerCount")}: <strong>{formatNumber(totals.producers)}</strong>
        </span>
      </div>
    </section>
  );
}

export function DashboardSummary({ summary, statuses, isRefreshing = false }) {
  const { t } = useTranslation();
  const { formatMoney, formatKhr, formatNumber, formatPercent } = useFormatters();

  if (!summary) {
    return (
      <div className="summary-skeleton" role="status" aria-live="polite" aria-busy="true">
        <div className="skeleton-line" />
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  const { totals, statusSummary } = summary;
  const totalOrders = Number(totals.orders || 0);

  return (
    <div className={`dashboard-summary ${isRefreshing ? "is-refreshing" : ""}`} aria-busy={isRefreshing}>
      <KpiRow totals={totals} t={t} formatKhr={formatKhr} formatMoney={formatMoney} formatNumber={formatNumber} />
      <CollectionHealth totals={totals} t={t} formatPercent={formatPercent} />
      <div className="dashboard-panels">
        <OrderPipeline
          statusSummary={statusSummary}
          statuses={statuses}
          totalOrders={totalOrders}
          t={t}
          formatNumber={formatNumber}
          formatPercent={formatPercent}
        />
        <FulfillmentNetwork totals={totals} t={t} formatNumber={formatNumber} formatPercent={formatPercent} />
      </div>
    </div>
  );
}
