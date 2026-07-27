import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "../../services/apiClient";
import { listMobileOrders } from "../services/orders";
import { groupCustomerOrders, sumBatchAmountDue } from "../utils/groupOrdersByBatch";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";
import { SectionHeader } from "../components/SectionHeader";
import { PortalButton } from "../components/PortalButton";
import { TabIcon } from "../components/TabIcon";

function StatusBadge({ status, t }) {
  const paid = String(status || "unpaid").toLowerCase() === "paid";
  return (
    <span className={`portal-status${paid ? " portal-status--paid" : ""}`}>
      {paid ? t("portal.payment.status.paid") : t("portal.payment.status.unpaid")}
    </span>
  );
}

export function CustomerOrdersPage({ token }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await listMobileOrders(token));
    } catch (err) {
      setError(getApiErrorMessage(err, t("portal.payment.ordersLoadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sections = useMemo(() => groupCustomerOrders(orders), [orders]);

  return (
    <div>
      <SectionHeader
        title={t("portal.payment.myOrdersTitle")}
        subtitle={t("portal.payment.myOrdersSubtitle")}
        action={
          <PortalButton tone="soft" onClick={() => void refresh()}>
            {t("portal.common.refresh")}
          </PortalButton>
        }
      />

      {loading ? <p className="portal-empty">{t("portal.common.loading")}</p> : null}
      {error ? <p className="portal-empty">{error}</p> : null}
      {!loading && !error && sections.length === 0 ? (
        <div className="portal-empty">
          <div className="portal-empty-icon">
            <TabIcon name="receipt" />
          </div>
          <h2>{t("portal.payment.noOrders")}</h2>
          <p>{t("portal.payment.noOrdersHint")}</p>
        </div>
      ) : null}

      {sections.map((section) => {
        if (section.type === "batch") {
          const due = sumBatchAmountDue(section.orders);
          const allPaid = section.orders.every(
            (o) => String(o.paymentStatus || "").toLowerCase() === "paid",
          );
          const currency = section.orders[0]?.currency || "KHR";
          return (
            <article key={`batch-${section.masterOrderId}`} className="portal-card">
              <div className="portal-row" style={{ borderBottom: 0, paddingTop: 0 }}>
                <h3 style={{ margin: 0 }}>{t("portal.payment.batchGroupTitle")}</h3>
                <StatusBadge status={allPaid ? "paid" : "unpaid"} t={t} />
              </div>
              <p className="portal-card-meta">
                {t("portal.payment.batchGroupCount", { count: section.orders.length })}
              </p>
              <p className="portal-card-meta">
                {t("portal.payment.batchToPay", {
                  amount: formatPaymentAmount(due, currency),
                })}
              </p>
              {section.orders.map((order) => (
                <p key={order.id} className="portal-card-meta">
                  {t("portal.payment.orderLine", {
                    id: order.id,
                    name: order.itemName || t("portal.payment.itemFallback"),
                  })}
                </p>
              ))}
              {!allPaid ? (
                <div className="portal-actions">
                  <Link
                    to={`/portal/pay-batch/${section.masterOrderId}`}
                    state={{ orders: section.orders }}
                    className="portal-btn portal-btn--primary portal-btn--block"
                  >
                    {t("portal.payment.payBatch")}
                  </Link>
                </div>
              ) : null}
            </article>
          );
        }

        const order = section.order;
        const paid = String(order.paymentStatus || "").toLowerCase() === "paid";
        return (
          <article key={`order-${order.id}`} className="portal-card">
            <div className="portal-row" style={{ borderBottom: 0, paddingTop: 0 }}>
              <h3 style={{ margin: 0 }}>
                {t("portal.payment.orderLine", {
                  id: order.id,
                  name: order.itemName || t("portal.payment.itemFallback"),
                })}
              </h3>
              <StatusBadge status={order.paymentStatus} t={t} />
            </div>
            <p className="portal-card-meta">
              {t("portal.payment.orderMeta", {
                status: order.status || "—",
                amount: formatPaymentAmount(order.amountTotal, order.currency || "KHR"),
              })}
            </p>
            {!paid ? (
              <div className="portal-actions">
                <Link
                  to={`/portal/pay/${order.id}`}
                  state={{ order }}
                  className="portal-btn portal-btn--primary portal-btn--block"
                >
                  {t("portal.payment.payNow")}
                </Link>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
