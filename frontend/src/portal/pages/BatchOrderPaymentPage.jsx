import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { KhqrPaymentModal } from "../components/KhqrPaymentModal";
import { PortalButton } from "../components/PortalButton";
import { useKhqrCheckout } from "../hooks/useKhqrCheckout";
import { usePaymentAmountOptions } from "../hooks/usePaymentAmountOptions";
import { listMobileOrders } from "../services/orders";
import { createBatchPaymentIntent } from "../services/payments";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";

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

  if (loadingOrders) {
    return <p className="portal-empty">{t("portal.common.loading")}</p>;
  }

  if (!orders.length) {
    return (
      <div>
        <p className="portal-empty">{t("portal.depot.batchPaymentMissing")}</p>
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
        <h1>{t("portal.payment.batchCheckoutTitle")}</h1>
      </div>

      <article className="portal-card">
        <p className="portal-card-meta">
          {t("portal.payment.batchCheckoutSubtitle", { count: orders.length })}
        </p>
        {orders.map((order) => (
          <p key={order.id} className="portal-card-meta">
            {t("portal.payment.orderLine", {
              id: order.id,
              name: order.itemName || t("portal.payment.itemFallback"),
            })}
          </p>
        ))}
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
        <div className="portal-actions">
          <PortalButton
            block
            disabled={submitting || loadingAmounts || amount == null}
            onClick={() =>
              void startCheckout(() =>
                createBatchPaymentIntent(token, {
                  masterOrderId,
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
