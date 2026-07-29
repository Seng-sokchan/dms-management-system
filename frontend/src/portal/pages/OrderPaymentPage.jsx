import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { KhqrPaymentModal } from "../components/KhqrPaymentModal";
import { PortalButton } from "../components/PortalButton";
import { useKhqrCheckout } from "../hooks/useKhqrCheckout";
import { usePaymentAmountOptions } from "../hooks/usePaymentAmountOptions";
import { listMobileOrders } from "../services/orders";
import { createPaymentIntent } from "../services/payments";
import { formatPaymentAmount, formatPaymentAmountParts } from "../utils/formatPaymentAmount";
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

export function OrderPaymentPage({ token }) {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loadingOrder, setLoadingOrder] = useState(!location.state?.order);

  useEffect(() => {
    if (order || !token || !orderId) return undefined;
    let cancelled = false;
    setLoadingOrder(true);
    listMobileOrders(token)
      .then((rows) => {
        if (cancelled) return;
        setOrder(rows.find((row) => String(row.id) === String(orderId)) || null);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order, orderId, token]);

  const orders = useMemo(() => (order ? [order] : []), [order]);
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

  const onPaymentSuccess = useCallback(
    (paymentId) => {
      navigate(`/portal/payment-result/${paymentId}`, {
        replace: true,
        state: { orderId: order?.id },
      });
    },
    [navigate, order?.id],
  );

  const { submitting, startCheckout, khqrModalProps } = useKhqrCheckout({
    token,
    amountLabel,
    merchantName: t("portal.payment.storeName"),
    onPaymentSuccess,
  });

  if (loadingOrder) {
    return <p className="portal-empty">{t("portal.common.loading")}</p>;
  }

  if (!order) {
    return (
      <div>
        <p className="portal-empty">{t("portal.payment.orderMissing")}</p>
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
        <h1>{t("portal.payment.checkoutTitle")}</h1>
      </div>

      <article className="portal-card portal-pay-summary">
        <div className="portal-pay-summary__line portal-pay-summary__line--last">
          <p className="portal-pay-summary__title">
            {t("portal.payment.orderLabel", { id: order.id })}
          </p>
          <p className="portal-pay-summary__meta">{order.itemName || "—"}</p>
          <p className="portal-pay-summary__meta">
            {t("portal.depot.batchOrderQuantity", { qty: Number(order.orderedQty || 0) })}
          </p>
        </div>
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
          onClick={() =>
            void startCheckout(() =>
              createPaymentIntent(token, {
                orderId: order.id,
                paymentOption: "checkout",
                currency,
              }),
            )
          }
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
