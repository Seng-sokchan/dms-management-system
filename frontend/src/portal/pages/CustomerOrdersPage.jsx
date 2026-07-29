import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "../../services/apiClient";
import { listMobileOrders } from "../services/orders";
import { groupCustomerOrders, sumBatchAmountDue } from "../utils/groupOrdersByBatch";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";
import { formatOrderStatus } from "../utils/formatOrderStatus";
import { DepotBatchPaymentActions } from "../components/DepotBatchPaymentActions";
import { SectionHeader } from "../components/SectionHeader";
import { PortalButton } from "../components/PortalButton";
import { TabIcon } from "../components/TabIcon";
import "./DepotOrdersPage.css";

function PaymentStatusBadge({ status, t }) {
  const normalized = String(status || "unpaid").toLowerCase();
  const paid = normalized === "paid";
  return (
    <span className={`portal-status${paid ? " portal-status--paid" : ""}`}>
      {t(`portal.payment.status.${paid ? "paid" : "unpaid"}`, paid ? "Paid" : "Unpaid")}
    </span>
  );
}

function BatchOrderCard({ masterOrderId, orders, t }) {
  const totalAmount = orders.reduce((sum, order) => sum + Number(order?.amountTotal || 0), 0);
  const amountDue = sumBatchAmountDue(orders);
  const amountPaid = Math.max(0, totalAmount - amountDue);
  const currency = orders[0]?.currency || "KHR";

  return (
    <article className="portal-card portal-depot-order-card">
      <h3 className="portal-depot-order-card__title">
        {orders[0]?.masterOrderNo || t("portal.payment.orderLabel", { id: masterOrderId })}
      </h3>
      <p className="portal-depot-order-card__line">
        {t(
          orders.length === 1
            ? "portal.payment.batchGroupCount"
            : "portal.payment.batchGroupCount_plural",
          { count: orders.length },
        )}
      </p>
      {amountDue > 0 ? (
        <p className="portal-depot-order-card__pay-line">
          {t("portal.payment.batchToPay", {
            amount: formatPaymentAmount(amountDue, currency),
          })}
        </p>
      ) : (
        <p className="portal-depot-order-card__pay-line">
          {t("portal.payment.batchPaidAmount", {
            amount: formatPaymentAmount(amountPaid, currency),
          })}
        </p>
      )}
      <div className="portal-depot-order-card__divider" />
      <DepotBatchPaymentActions
        masterOrderId={masterOrderId}
        orders={orders}
        i18nPrefix="portal.payment"
      />
    </article>
  );
}

function OrderCard({ order, t }) {
  const paymentStatus = order?.paymentStatus || "unpaid";
  const canPay = String(paymentStatus).toLowerCase() !== "paid";

  return (
    <article className="portal-card portal-depot-order-card">
      <h3 className="portal-depot-order-card__title">
        {t("portal.payment.orderLine", {
          id: order.id,
          name: order.itemName || t("portal.payment.itemFallback"),
        })}
      </h3>
      <p className="portal-depot-order-card__line">
        {t("portal.payment.orderMeta", {
          status: formatOrderStatus(order.status, t),
          amount: formatPaymentAmount(order.amountTotal, order.currency || "KHR"),
        })}
      </p>
      <div className="portal-batch-pay">
        <div
          className={`portal-batch-pay__badge-row${
            canPay ? " portal-batch-pay__badge-row--spaced" : ""
          }`}
        >
          <PaymentStatusBadge status={paymentStatus} t={t} />
        </div>
        {canPay ? (
          <Link
            to={`/portal/pay/${order.id}`}
            state={{ order }}
            className="portal-btn portal-btn--primary portal-btn--block"
          >
            {t("portal.payment.payNow")}
          </Link>
        ) : null}
      </div>
    </article>
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

      {!loading && error ? (
        <article className="portal-card">
          <h3>{t("portal.payment.ordersLoadFailed")}</h3>
          <p className="portal-card-meta">{error}</p>
          <div className="portal-actions">
            <PortalButton onClick={() => void refresh()}>
              {t("portal.common.tryAgain")}
            </PortalButton>
          </div>
        </article>
      ) : null}

      {!loading && !error && sections.length === 0 ? (
        <div className="portal-empty">
          <div className="portal-empty-icon">
            <TabIcon name="receipt" />
          </div>
          <h2>{t("portal.payment.noOrders")}</h2>
          <p>{t("portal.payment.noOrdersHint")}</p>
        </div>
      ) : null}

      {!loading
        ? sections.map((section) => {
            if (section.type === "batch") {
              return (
                <BatchOrderCard
                  key={`batch-${section.masterOrderId}`}
                  masterOrderId={section.masterOrderId}
                  orders={section.orders}
                  t={t}
                />
              );
            }
            return (
              <OrderCard key={`order-${section.order.id}`} order={section.order} t={t} />
            );
          })
        : null}
    </div>
  );
}
