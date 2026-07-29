import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { KhqrPaymentModal } from "../components/KhqrPaymentModal";
import { PortalButton } from "../components/PortalButton";
import { useKhqrCheckout } from "../hooks/useKhqrCheckout";
import { usePaymentAmountOptions } from "../hooks/usePaymentAmountOptions";
import { listMobileOrders } from "../services/orders";
import { createBatchPaymentIntent } from "../services/payments";
import { formatPaymentAmount, formatPaymentAmountParts } from "../utils/formatPaymentAmount";
import { ORDER_TYPE_CUSTOMER } from "../constants/orderTypes";
import "./PaymentCheckout.css";

const CURRENCY_OPTIONS = ["KHR", "USD"];

function AbaKhqrMethodIcon() {
  return (
    <span className="portal-pay-method__icon" aria-hidden>
      <span className="portal-pay-method__icon-top">ABA</span>
      <span className="portal-pay-method__icon-bottom">KHQR</span>
    </span>
  );
}

export function BatchOrderPaymentPage({ token }) {
  const { masterOrderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState(
    Array.isArray(location.state?.orders) ? location.state.orders : [],
  );
  const [loadingOrders, setLoadingOrders] = useState(
    !Array.isArray(location.state?.orders) || location.state.orders.length === 0,
  );

  useEffect(() => {
    if (orders.length > 0 || !token || !masterOrderId) return undefined;
    let cancelled = false;
    setLoadingOrders(true);
    listMobileOrders(token)
      .then((rows) => {
        if (cancelled) return;
        setOrders(rows.filter((row) => String(row.masterOrderId) === String(masterOrderId)));
      })
      .finally(() => {
        if (!cancelled) setLoadingOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, [masterOrderId, orders.length, token]);

  const {
    currency,
    setCurrency,
    amount,
    loading: loadingAmounts,
  } = usePaymentAmountOptions({ token, orders });

  const amountLabel = useMemo(
    () => (amount != null ? formatPaymentAmount(amount, currency) : ""),
    [amount, currency],
  );
  const amountParts = useMemo(
    () => formatPaymentAmountParts(amount, currency),
    [amount, currency],
  );
  const isCustomerBatch = orders[0]?.masterOrderType === ORDER_TYPE_CUSTOMER;

  const onPaymentSuccess = useCallback(
    (paymentId) => {
      navigate(`/portal/payment-result/${paymentId}`, {
        replace: true,
        state: { masterOrderId, orderIds: orders.map((o) => o.id) },
      });
    },
    [masterOrderId, navigate, orders],
  );

  const { submitting, startCheckout, khqrModalProps } = useKhqrCheckout({
    token,
    amountLabel,
    merchantName: t("portal.payment.storeName"),
    onPaymentSuccess,
  });

  const handleAbaKhqrPay = () => {
    if (!token || !masterOrderId || loadingAmounts || amount == null) return;
    void startCheckout(() =>
      createBatchPaymentIntent(token, {
        masterOrderId,
        paymentOption: "checkout",
        currency,
      }),
    );
  };

  if (loadingOrders) {
    return <p className="portal-empty">{t("portal.common.loading")}</p>;
  }

  if (!masterOrderId || orders.length === 0) {
    return (
      <div>
        <p className="portal-empty">{t("portal.depot.batchPaymentMissing")}</p>
        <PortalButton block onClick={() => navigate(-1)}>
          {t("portal.payment.backToOrders")}
        </PortalButton>
      </div>
    );
  }

  const showAmount = !loadingAmounts && amount != null && amountParts.value !== "—";

  return (
    <div className="portal-pay-checkout">
      <div className="portal-stack-header">
        <button type="button" className="portal-back" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <h1>{t("portal.payment.batchCheckoutTitle")}</h1>
      </div>

      <article className="portal-card portal-pay-summary">
        {orders.map((order, index) => (
          <div
            key={order.id}
            className={`portal-pay-summary__line${
              index === orders.length - 1 ? " portal-pay-summary__line--last" : ""
            }`}
          >
            <p className="portal-pay-summary__title">
              {t("portal.payment.orderLabel", { id: order.id })}
            </p>
            <p className="portal-pay-summary__meta">
              {isCustomerBatch
                ? order.itemName || "—"
                : `${order.customerName || "—"} · ${order.itemName || "—"}`}
            </p>
            <p className="portal-pay-summary__meta">
              {t("portal.depot.batchOrderQuantity", { qty: Number(order.orderedQty || 0) })}
            </p>
          </div>
        ))}
      </article>

      <article className="portal-card portal-pay-amount">
        <p className="portal-pay-amount__label">{t("portal.payment.amountToPay")}</p>
        <p className="portal-pay-amount__currency-label">{t("portal.payment.currencyLabel")}</p>
        <div className="portal-pay-amount__hint" role="note">
          <span className="portal-pay-amount__hint-icon" aria-hidden>
            i
          </span>
          <span>{t("portal.payment.currencySelectHint")}</span>
        </div>
        <div
          className="portal-pay-amount__segments"
          role="radiogroup"
          aria-label={t("portal.payment.currencyLabel")}
        >
          {CURRENCY_OPTIONS.map((code) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={currency === code}
              className={`portal-pay-amount__segment${
                currency === code ? " portal-pay-amount__segment--active" : ""
              }`}
              onClick={() => setCurrency(code)}
            >
              {code}
            </button>
          ))}
        </div>
        <div className="portal-pay-amount__divider" />
        <div className="portal-pay-amount__value-row">
          {loadingAmounts ? (
            <p className="portal-pay-amount__placeholder">{t("portal.payment.loadingAmount")}</p>
          ) : showAmount ? (
            <>
              <span className="portal-pay-amount__value">{amountParts.value}</span>
              <span className="portal-pay-amount__unit">{amountParts.unit}</span>
            </>
          ) : (
            <p className="portal-pay-amount__placeholder">
              {t("portal.payment.amountUnavailable")}
            </p>
          )}
        </div>
      </article>

      <h2 className="portal-pay-checkout__title">{t("portal.payment.choosePaymentTitle")}</h2>

      <div className="portal-pay-methods">
        <button
          type="button"
          className="portal-pay-method"
          disabled={submitting || loadingAmounts || amount == null}
          onClick={handleAbaKhqrPay}
        >
          <AbaKhqrMethodIcon />
          <span className="portal-pay-method__body">
            <span className="portal-pay-method__name">
              {submitting ? t("portal.payment.starting") : t("portal.payment.methodAbaKhqr")}
            </span>
            <span className="portal-pay-method__hint">{t("portal.payment.methodAbaKhqrHint")}</span>
          </span>
          <span className="portal-pay-method__chevron" aria-hidden>
            ›
          </span>
        </button>
      </div>

      <KhqrPaymentModal {...khqrModalProps} />
    </div>
  );
}
