import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "../../services/apiClient";
import { listMobileOrders } from "../services/orders";
import { groupDepotOrders, sumBatchAmountDue } from "../utils/groupOrdersByBatch";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";
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

function formatDate(value, locale) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString(locale);
  } catch {
    return String(value);
  }
}

function BatchOrderCard({ masterOrderId, orders, t, locale }) {
  const totalAmount = orders.reduce((sum, order) => sum + Number(order?.amountTotal || 0), 0);
  const totalQuantity = orders.reduce((sum, order) => sum + Number(order?.orderedQty || 0), 0);
  const amountDue = sumBatchAmountDue(orders);
  const amountPaid = Math.max(0, totalAmount - amountDue);
  const currency = orders[0]?.currency || "KHR";

  return (
    <article className="portal-card portal-depot-order-card">
      <div className="portal-depot-order-card__header">
        <h3 className="portal-depot-order-card__title">
          {orders[0]?.masterOrderNo || t("portal.depot.batchGroupTitle")}
        </h3>
      </div>
      <p className="portal-depot-order-card__total">
        {t(
          totalQuantity === 1
            ? "portal.depot.batchTotalQuantity"
            : "portal.depot.batchTotalQuantity_plural",
          { qty: totalQuantity.toLocaleString(locale) },
        )}
      </p>
      {amountDue > 0 ? (
        <p className="portal-depot-order-card__pay-line">
          {t("portal.depot.batchToPay", {
            amount: formatPaymentAmount(amountDue, currency),
          })}
        </p>
      ) : (
        <p className="portal-depot-order-card__pay-line">
          {t("portal.depot.batchPaidAmount", {
            amount: formatPaymentAmount(amountPaid, currency),
          })}
        </p>
      )}
      <div className="portal-depot-order-card__divider" />
      <DepotBatchPaymentActions masterOrderId={masterOrderId} orders={orders} />
    </article>
  );
}

function OrderCard({ order, t, locale }) {
  const qty = Number(order?.orderedQty || 0);
  const total = Number(order?.amountTotal || 0);
  const skuPart = order.itemSku ? t("portal.depot.orderItemSku", { sku: order.itemSku }) : "";
  const paymentStatus = order?.paymentStatus || "unpaid";
  const canPay = String(paymentStatus).toLowerCase() !== "paid";

  return (
    <article className="portal-card portal-depot-order-card">
      <div className="portal-depot-order-card__header">
        <h3 className="portal-depot-order-card__title">#{order.id}</h3>
        <span className="portal-depot-order-card__status">{order.status || "—"}</span>
      </div>
      <p className="portal-depot-order-card__line">
        {t("portal.depot.orderCustomer", { name: order.customerName || "—" })}
      </p>
      <p className="portal-depot-order-card__line">
        {t("portal.depot.orderItem", { name: order.itemName || "—", sku: skuPart })}
      </p>
      <p className="portal-depot-order-card__line">
        {t("portal.depot.orderQty", {
          qty,
          total: formatPaymentAmount(total, order.currency || "KHR"),
        })}
      </p>
      {order.deliveryAgentName ? (
        <p className="portal-depot-order-card__line">
          {t("portal.depot.orderDriver", { name: order.deliveryAgentName })}
        </p>
      ) : null}
      {order.createdAt ? (
        <p className="portal-depot-order-card__meta">
          {t("portal.depot.orderCreated", {
            date: formatDate(order.createdAt, locale),
          })}
        </p>
      ) : null}
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

export function DepotOrdersPage({ token }) {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const locale = i18n.language === "km" ? "km-KH" : "en-US";

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

  const subtitle =
    orders.length > 0
      ? t(
          orders.length === 1
            ? "portal.depot.ordersSubtitleCount"
            : "portal.depot.ordersSubtitleCount_plural",
          { count: orders.length },
        )
      : t("portal.depot.ordersSubtitleEmpty");

  const headerSubtitle = loading
    ? t("portal.depot.loadingOrders")
    : `${subtitle}\n${t("portal.depot.ordersPaymentHint")}`;

  return (
    <div className="portal-depot-orders">
      <SectionHeader
        title={t("portal.depot.ordersTitle")}
        subtitle={headerSubtitle}
        action={
          <PortalButton tone="soft" onClick={() => void refresh()}>
            {t("portal.common.refresh")}
          </PortalButton>
        }
      />

      {loading ? <p className="portal-empty">{t("portal.common.loading")}</p> : null}

      {!loading && error ? (
        <article className="portal-card">
          <h3>{t("portal.depot.loadOrdersError")}</h3>
          <p className="portal-card-meta">{error}</p>
          <div className="portal-actions">
            <PortalButton
              onClick={() => {
                void refresh();
              }}
            >
              {t("portal.common.tryAgain")}
            </PortalButton>
          </div>
        </article>
      ) : null}

      {!loading && !error && sections.length === 0 ? (
        <div className="portal-empty">
          <div className="portal-empty-icon">
            <TabIcon name="package" />
          </div>
          <h2>{t("portal.depot.noOrdersTitle")}</h2>
          <p>{t("portal.depot.noOrdersSubtitle")}</p>
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
                  locale={locale}
                />
              );
            }
            return (
              <OrderCard
                key={`order-${section.order.id}`}
                order={section.order}
                t={t}
                locale={locale}
              />
            );
          })
        : null}
    </div>
  );
}
