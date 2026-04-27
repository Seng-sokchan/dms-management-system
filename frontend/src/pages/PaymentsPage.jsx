import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { PaymentsSection } from "../components/PaymentsSection";
import { CustomerPaymentsSection } from "../components/CustomerPaymentsSection";
import { generatePaymentKhqr } from "../services/adminApi/payments";

const KHQR_EXPIRATION_MS = 5 * 60 * 1000;

export function PaymentsPage({
  token,
  user,
  orders,
  payments,
  paymentMethods,
  newPayment,
  setNewPayment,
  onSubmitPayment,
}) {
  const { t } = useTranslation();
  const [abaOrder, setAbaOrder] = useState(null);
  const [khqr, setKhqr] = useState("");
  const [khqrImage, setKhqrImage] = useState("");
  const [khqrLoading, setKhqrLoading] = useState(false);
  const [khqrError, setKhqrError] = useState("");
  const [khqrExpiresAt, setKhqrExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [selectedPayAmount, setSelectedPayAmount] = useState(0);
  const isCustomerRole = user?.role === "Customer";
  const customerOrders = isCustomerRole ? orders : [];

  function getRemainingAmount(order) {
    const remaining = Math.max(0, Number(order?.amountTotal || 0) - Number(order?.amountPaid || 0));
    return Number(remaining.toFixed(2));
  }

  async function requestKhqr(order, { keepCurrentQr = false, amountOverride } = {}) {
    if (!keepCurrentQr) {
      setKhqr("");
    }
    setKhqrImage("");
    setKhqrError("");
    setKhqrLoading(true);
    try {
      const amountToPay = amountOverride != null ? Number(amountOverride) : getRemainingAmount(order);
      const payload = {
        amount: amountToPay,
        currency: "USD",
      };
      if (order?.id && order.id !== "all") {
        payload.orderId = String(order.id);
      }
      const response = await generatePaymentKhqr(token, payload);
      const khqrText = response?.data?.khqr || response?.khqr || "";
      setKhqr(khqrText);
      if (!khqrText) {
        setKhqrError("KHQR was generated but empty.");
        setKhqrExpiresAt(null);
        setSecondsLeft(0);
      } else {
        const expiresAt = Date.now() + KHQR_EXPIRATION_MS;
        setKhqrExpiresAt(expiresAt);
        setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
      }
    } catch (error) {
      setKhqrError(error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Failed to generate KHQR");
      setKhqrExpiresAt(null);
      setSecondsLeft(0);
    } finally {
      setKhqrLoading(false);
    }
  }

  async function handlePayWithAba(order) {
    const amountFromList = order?.mode === "all"
      ? Number(order.amount || 0)
      : getRemainingAmount(order);
    setAbaOrder(order);
    setSelectedPayAmount(amountFromList);
    await requestKhqr(order, { amountOverride: amountFromList });
  }

  useEffect(() => {
    let active = true;
    if (!khqr) {
      setKhqrImage("");
      return () => {
        active = false;
      };
    }
    QRCode.toDataURL(khqr, { width: 280, margin: 1 })
      .then((dataUrl) => {
        if (active) {
          setKhqrImage(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setKhqrError("Failed to render QR image.");
          setKhqrImage("");
        }
      });
    return () => {
      active = false;
    };
  }, [khqr]);

  useEffect(() => {
    if (!abaOrder || !khqrExpiresAt) return undefined;
    const intervalId = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.ceil((khqrExpiresAt - Date.now()) / 1000));
      setSecondsLeft(remainingSeconds);
      if (remainingSeconds <= 0 && !khqrLoading) {
        setKhqrExpiresAt(null);
        void requestKhqr(abaOrder, { keepCurrentQr: true, amountOverride: selectedPayAmount });
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [abaOrder, khqrExpiresAt, khqrLoading, selectedPayAmount]);

  function formatCountdown(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const timerProgress = Math.max(0, Math.min(1, secondsLeft / (KHQR_EXPIRATION_MS / 1000)));
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - timerProgress);

  return (
    <section className="admin-page">
      <div className="section-heading">
        <h2>{t("payments.title")}</h2>
        <p className="section-lead">{isCustomerRole ? t("payments.customerLead") : t("payments.lead")}</p>
      </div>
      {isCustomerRole ? (
        <CustomerPaymentsSection orders={customerOrders} onPayWithAba={handlePayWithAba} />
      ) : (
        <PaymentsSection
          orders={orders}
          payments={payments}
          paymentMethods={paymentMethods}
          newPayment={newPayment}
          setNewPayment={setNewPayment}
          onSubmitPayment={onSubmitPayment}
        />
      )}
      {abaOrder ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="aba-modal-title">
          <div className="panel modal-card aba-modal-card">
            <div className="aba-modal-header">
              <h3 id="aba-modal-title">{t("payments.payWithAba")}</h3>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setAbaOrder(null)}
              >
                {t("payments.close")}
              </button>
            </div>
            <p className="aba-modal-subtitle">
              {t("payments.scanQrInstruction")}
            </p>
            <div className="aba-modal-body">
              <div className="aba-order-info">
                {khqrLoading ? <p>{t("common.loading", { defaultValue: "Loading..." })}</p> : null}
                {!khqrLoading && khqrError ? <p className="admin-flash--error">{khqrError}</p> : null}
                {!khqrLoading && !khqrError && khqr ? (
                  <div className="khqr-preview-card">
                    {khqrImage ? (
                      <img src={khqrImage} alt="Generated KHQR" className="khqr-image" />
                    ) : (
                      <p>{t("common.loading", { defaultValue: "Loading..." })}</p>
                    )}
                    <div className="khqr-timer-wrap" aria-live="polite">
                      <div className="khqr-timer-circle" role="img" aria-label={t("payments.qrExpiresIn", { time: formatCountdown(secondsLeft) })}>
                        <svg className="khqr-timer-svg" viewBox="0 0 84 84">
                          <circle className="khqr-timer-track" cx="42" cy="42" r={ringRadius} />
                          <circle
                            className="khqr-timer-progress"
                            cx="42"
                            cy="42"
                            r={ringRadius}
                            strokeDasharray={ringCircumference}
                            strokeDashoffset={ringOffset}
                          />
                        </svg>
                        <div className="khqr-timer-text">{formatCountdown(secondsLeft)}</div>
                      </div>
                      <p className="aba-refresh-hint khqr-refresh-note">
                        {khqrLoading
                          ? t("payments.generatingNewQr")
                          : t("payments.autoRefreshEveryFiveMinutes")}
                      </p>
                    </div>
                    <p className="aba-refresh-hint khqr-refresh-note">
                      {t("payments.debtAmount")}: ${selectedPayAmount.toFixed(2)}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
