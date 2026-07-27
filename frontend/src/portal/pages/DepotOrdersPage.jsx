import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "../../services/apiClient";
import { listMobileOrders } from "../services/orders";
import { groupDepotOrders, sumBatchAmountDue } from "../utils/groupOrdersByBatch";
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

export function DepotOrdersPage({ token }) {
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
      setError(getApiErrorMessage(err, t("portal.depot.loadOrdersError")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sections = useMemo(() => groupDepotOrders(orders), [orders]);

  return (
    <div>
      <SectionHeader
        title={t("portal.depot.ordersTitle")}
        subtitle={t("portal.depot.ordersPaymentHint")}
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
            <TabIcon name="package" />
          </div>
          <h2>{t("portal.depot.noOrdersTitle")}</h2>
          <p>{t("portal.depot.noOrdersSubtitle")}</p>
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
                <h3 style={{ margin: 0 }}>{t("portal.depot.batchGroupTitle")}</h3>
                <StatusBadge status={allPaid ? "paid" : "unpaid"} t={t} />
              </div>
              <p className="portal-card-meta">
                {t("portal.depot.batchGroupCount", { count: section.orders.length })}
              </p>
              <p className="portal-card-meta">
                {t("portal.depot.batchToPay", {
                  amount: formatPaymentAmount(due, currency),
                })}
              </p>
              {section.orders.map((order) => (
                <p key={order.id} className="portal-card-meta">
                  {t("portal.depot.orderCustomer", {
                    name: order.customerName || order.customerId || "—",
                  })}
                  {" · "}
                  {order.itemName || "—"}
                </p>
              ))}
              {!allPaid ? (
                <div className="portal-actions">
                  <Link
                    to={`/portal/pay-batch/${section.masterOrderId}`}
                    state={{ orders: section.orders }}
                    className="portal-btn portal-btn--primary portal-btn--block"
                  >
                    {t("portal.depot.payBatch")}
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
              <h3 style={{ margin: 0 }}>{t("portal.payment.orderLabel", { id: order.id })}</h3>
              <StatusBadge status={order.paymentStatus} t={t} />
            </div>
            <p className="portal-card-meta">
              {t("portal.depot.orderCustomer", {
                name: order.customerName || order.customerId || "—",
              })}
            </p>
            <p className="portal-card-meta">
              {t("portal.depot.orderItem", {
                name: order.itemName || "—",
                sku: order.itemSku ? t("portal.depot.orderItemSku", { sku: order.itemSku }) : "",
              })}
            </p>
            <p className="portal-card-meta">
              {t("portal.depot.orderQty", {
                qty: order.orderedQty || 0,
                total: formatPaymentAmount(order.amountTotal, order.currency || "KHR"),
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
