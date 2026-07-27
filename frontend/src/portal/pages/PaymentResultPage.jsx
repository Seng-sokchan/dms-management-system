import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PaymentSuccessIllustration } from "../components/PaymentSuccessIllustration";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";
import "./PaymentResultPage.css";

export function PaymentResultPage({ token, user }) {
  const { paymentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { status, payment, loading, error } = usePaymentStatus(token, paymentId, {
    autoRefresh: true,
  });
  const [redirecting, setRedirecting] = useState(false);

  const isPaid = status === "paid";
  const customerName = user?.name || user?.username || t("portal.payment.successNameFallback");
  const ordersPath = user?.role === "Depot" ? "/portal/depot-orders" : "/portal/orders";
  const orderId = location.state?.orderId;
  const masterOrderId = location.state?.masterOrderId;
  const orderIds = Array.isArray(location.state?.orderIds) ? location.state.orderIds : null;

  useEffect(() => {
    if (loading || !paymentId || isPaid) return undefined;

    setRedirecting(true);
    const timer = setTimeout(() => {
      if (masterOrderId) {
        navigate(`/portal/pay-batch/${masterOrderId}`, {
          replace: true,
          state: { orderIds },
        });
        return;
      }
      if (orderId) {
        navigate(`/portal/pay/${orderId}`, { replace: true });
        return;
      }
      navigate(ordersPath, { replace: true });
    }, 1800);

    return () => clearTimeout(timer);
  }, [isPaid, loading, masterOrderId, navigate, orderId, orderIds, ordersPath, paymentId]);

  async function handleDownloadReceipt() {
    const amount = formatPaymentAmount(payment?.amount, payment?.currency);
    const lines = [
      t("portal.payment.successTitle"),
      t("portal.payment.storeName"),
      payment?.orderId ? `${t("portal.payment.orderNumberLabel")}: #${payment.orderId}` : null,
      amount && amount !== "—" ? `${t("portal.payment.total")}: ${amount}` : null,
      payment?.paidAt
        ? `${t("portal.payment.paidAtLabel")}: ${new Date(payment.paidAt).toLocaleString()}`
        : null,
      `${t("portal.payment.orderNumberLabel")} ID: ${paymentId}`,
    ].filter(Boolean);
    const message = lines.join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: t("portal.payment.downloadReceipt"),
          text: message,
        });
        return;
      }
    } catch {
      // User dismissed share sheet.
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const blob = new Blob([message], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${paymentId || "payment"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  if (!isPaid) {
    return (
      <div className="pay-result pay-result--pending">
        {redirecting ? (
          <p className="pay-result__pending-text">{t("portal.payment.redirectingUnpaid")}</p>
        ) : (
          <div className="pay-result__spinner" aria-label={t("portal.common.loading")} />
        )}
      </div>
    );
  }

  return (
    <div className="pay-result">
      <header className="pay-result__header">
        <img src="/logo.png" alt="" className="pay-result__logo" />
        <p className="pay-result__store">{t("portal.payment.storeName")}</p>
      </header>

      <div className="pay-result__body">
        <PaymentSuccessIllustration />
        <h1 className="pay-result__title">{t("portal.payment.successTitle")}</h1>
        <p className="pay-result__hint">
          {t("portal.payment.successNameHint", { name: customerName })}
        </p>
        {error ? <p className="pay-result__error">{error}</p> : null}
      </div>

      <div className="pay-result__footer">
        <button
          type="button"
          className="pay-result__btn pay-result__btn--outline"
          onClick={handleDownloadReceipt}
        >
          {t("portal.payment.downloadReceipt")}
        </button>
        <button
          type="button"
          className="pay-result__btn pay-result__btn--primary"
          onClick={() => navigate(ordersPath)}
        >
          {t("portal.payment.continueShopping")}
        </button>
      </div>
    </div>
  );
}
