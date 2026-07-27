import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { KhqrPaymentModal } from "../components/KhqrPaymentModal";
import { PortalButton } from "../components/PortalButton";
import { useKhqrCheckout } from "../hooks/useKhqrCheckout";
import { usePaymentAmountOptions } from "../hooks/usePaymentAmountOptions";
import { listMobileOrders } from "../services/orders";
import { createPaymentIntent } from "../services/payments";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";

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
    availableCurrencies,
    loading: loadingAmounts,
  } = usePaymentAmountOptions({ token, orders });

  const amountLabel = useMemo(
    () => (amount != null ? formatPaymentAmount(amount, currency) : ""),
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

  return (
    <div>
      <div className="portal-stack-header">
        <button type="button" className="portal-back" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <h1>{t("portal.payment.checkoutTitle")}</h1>
      </div>

      <article className="portal-card">
        <h3>{t("portal.payment.orderLabel", { id: order.id })}</h3>
        <p className="portal-card-meta">{order.itemName || "—"}</p>
        <p className="portal-card-meta">
          {t("portal.depot.batchOrderQuantity", { qty: Number(order.orderedQty || 0) })}
        </p>
      </article>

      <article className="portal-card">
        <p className="portal-card-meta">{t("portal.payment.amountToPay")}</p>
        <h3 style={{ fontSize: "1.5rem", marginBottom: 12 }}>
          {loadingAmounts
            ? t("portal.payment.loadingAmount")
            : amountLabel || t("portal.payment.amountUnavailable")}
        </h3>
        <div className="portal-actions">
          {availableCurrencies.map((code) => (
            <PortalButton
              key={code}
              tone={currency === code ? "primary" : "soft"}
              onClick={() => setCurrency(code)}
            >
              {code}
            </PortalButton>
          ))}
        </div>
      </article>

      <article className="portal-card">
        <h3>{t("portal.payment.choosePaymentTitle")}</h3>
        <p className="portal-card-meta">{t("portal.payment.methodAbaKhqrHint")}</p>
        <div className="portal-actions">
          <PortalButton
            block
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
            {submitting ? t("portal.payment.starting") : t("portal.payment.methodAbaKhqr")}
          </PortalButton>
        </div>
      </article>

      <KhqrPaymentModal {...khqrModalProps} />
    </div>
  );
}
