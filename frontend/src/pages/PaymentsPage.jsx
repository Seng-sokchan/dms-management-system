import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { PaymentsSection } from "../components/PaymentsSection";
import { CustomerPaymentsSection } from "../components/CustomerPaymentsSection";
import {
  generatePaymentKhqr,
  checkPaymentKhqrByMd5List,
  confirmPaymentKhqrTransaction,
} from "../services/adminApi/payments";
import { useConfirm } from "../components/ConfirmProvider";

const KHQR_EXPIRATION_MS = 5 * 60 * 1000;
const KHQR_CHECK_INTERVAL_MS = 5000;

export function PaymentsPage({
  token,
  user,
  orders,
  payments,
  paymentMethods,
  newPayment,
  setNewPayment,
  onSubmitPayment,
  onRefreshData,
}) {
  const { t } = useTranslation();
  const { alert } = useConfirm();
  const [abaOrder, setAbaOrder] = useState(null);
  const [khqr, setKhqr] = useState("");
  const [khqrImage, setKhqrImage] = useState("");
  const [khqrLoading, setKhqrLoading] = useState(false);
  const [khqrError, setKhqrError] = useState("");
  const [khqrExpiresAt, setKhqrExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [selectedPayAmount, setSelectedPayAmount] = useState(0);
  const [khqrMd5, setKhqrMd5] = useState("");
  const [khqrMd5History, setKhqrMd5History] = useState([]);
  const [khqrCheckResult, setKhqrCheckResult] = useState(null);
  const [successTransaction, setSuccessTransaction] = useState(null);
  const [bakongTokenExpiredAlerted, setBakongTokenExpiredAlerted] = useState(false);
  const handledSuccessMd5Ref = useRef(null);
  const isCustomerRole = user?.role === "Customer";
  const customerOrders = isCustomerRole
    ? (orders || []).filter(
      (order) => Math.max(0, Number(order?.amountTotal || 0) - Number(order?.amountPaid || 0)) > 0,
    )
    : [];

  function getRemainingAmount(order) {
    const remaining = Math.max(0, Number(order?.amountTotal || 0) - Number(order?.amountPaid || 0));
    return Number(remaining.toFixed(2));
  }

  function getSuccessfulTransaction(payload) {
    if (!payload || Number(payload.responseCode) !== 0 || !Array.isArray(payload.data)) {
      return null;
    }
    return payload.data.find((item) => {
      const status = String(item?.status || "").toUpperCase();
      return status === "SUCCESS" || status === "APPROVED" || status === "COMPLETED";
    }) || null;
  }

  async function requestKhqr(order, { keepCurrentQr = false, amountOverride } = {}) {
    if (!keepCurrentQr) {
      setKhqr("");
    }
    setKhqrImage("");
    setKhqrError("");
    setKhqrCheckResult(null);
    setKhqrMd5("");
    setKhqrMd5History([]);
    setSuccessTransaction(null);
    handledSuccessMd5Ref.current = null;
    setBakongTokenExpiredAlerted(false);
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
      const md5Value = response?.data?.md5 || response?.md5 || "";
      setKhqr(khqrText);
      const md5ForCheck = md5Value || khqrText;
      setKhqrMd5(md5ForCheck);
      setKhqrMd5History((prev) => {
        if (!md5ForCheck) return prev;
        if (prev.includes(md5ForCheck)) return prev;
        return [...prev, md5ForCheck];
      });
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

  async function checkMd5List(md5List) {
    if (!Array.isArray(md5List) || md5List.length === 0) return;
    try {
      const response = await checkPaymentKhqrByMd5List(token, md5List);
      const payload = response?.data || response;
      setKhqrCheckResult(payload);
      const foundSuccess = getSuccessfulTransaction(payload);
      if (foundSuccess) {
        const successMd5 = String(foundSuccess?.md5 || "");
        if (!successMd5 || handledSuccessMd5Ref.current === successMd5) {
          return;
        }
        handledSuccessMd5Ref.current = successMd5;
        const selectedOrderIds = Array.isArray(abaOrder?.orderIds)
          ? abaOrder.orderIds.map((id) => String(id))
          : [];
        const orderId = abaOrder?.id;
        const confirmPayload = { transaction: foundSuccess };
        if (selectedOrderIds.length > 0) {
          confirmPayload.orderIds = selectedOrderIds;
        } else if (orderId && orderId !== "all") {
          confirmPayload.orderId = String(orderId);
        }
        if (confirmPayload.orderId || confirmPayload.orderIds) {
          try {
            await confirmPaymentKhqrTransaction(token, confirmPayload);
            if (typeof onRefreshData === "function") {
              await onRefreshData();
            }
          } catch (confirmError) {
            handledSuccessMd5Ref.current = null;
            await alert({
              title: t("confirm.warningTitle", { defaultValue: "Warning" }),
              message:
                confirmError?.response?.data?.message ||
                t("errors.confirmBakongPayment", {
                  defaultValue:
                    "Could not record payment in the app. The transaction still succeeded on Bakong.",
                }),
              tone: "warning",
            });
            return;
          }
        }
        setSuccessTransaction(foundSuccess);
        setAbaOrder(null);
      }
    } catch (error) {
      const errorCode = error?.response?.data?.errorCode;
      if (errorCode === "BAKONG_TOKEN_EXPIRED" && !bakongTokenExpiredAlerted) {
        setBakongTokenExpiredAlerted(true);
        await alert({
          title: t("confirm.warningTitle", { defaultValue: "Warning" }),
          message: t(
            "payments.bakongTokenExpired",
            { defaultValue: "Bakong token expired. Please update token in database." },
          ),
          tone: "danger",
        });
      }
      setKhqrCheckResult({
        responseCode: -1,
        responseMessage: error?.response?.data?.message || error?.message || "Failed to check transaction",
        data: [],
      });
    }
  }

  async function handlePayWithAba(order) {
    const amountFromList = order?.mode === "all"
      ? Number(order.amount || 0)
      : getRemainingAmount(order);
    if (order?.mode === "all") {
      const orderIds = customerOrders
        .filter((row) => getRemainingAmount(row) > 0)
        .map((row) => String(row.id));
      setAbaOrder({ ...order, orderIds });
    } else {
      setAbaOrder(order);
    }
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
    if (!abaOrder || khqrMd5History.length === 0 || successTransaction) return undefined;
    void checkMd5List(khqrMd5History);
    const intervalId = setInterval(() => {
      void checkMd5List(khqrMd5History);
    }, KHQR_CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [abaOrder, bakongTokenExpiredAlerted, khqrMd5History, successTransaction, token, alert, t]);

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
      {successTransaction ? (
        <div
          className="modal-overlay payment-success-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-success-title"
        >
          <div className="panel modal-card payment-success-modal">
            <div className="payment-success-hero">
              <div className="payment-success-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                  <path
                    d="M15 24.5l6 6L34 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 id="payment-success-title" className="payment-success-heading">
                {t("payments.paymentReceived")}
              </h2>
              <p className="payment-success-subtitle">
                {successTransaction?.message || t("payments.transactionSuccess")}
              </p>
            </div>

            <div className="payment-success-body">
              {successTransaction?.data ? (
                <>
                  <div className="payment-success-amount-block">
                    <span className="payment-success-amount-label">{t("payments.bakongAmount")}</span>
                    <p className="payment-success-amount">
                      <span className="payment-success-currency">{successTransaction.data.currency}</span>
                      <span className="payment-success-amount-value">
                        {Number(successTransaction.data.amount).toFixed(2)}
                      </span>
                    </p>
                  </div>

                  <ul className="payment-success-list">
                    {successTransaction.data.externalRef ? (
                      <li className="payment-success-list__row">
                        <span className="payment-success-list__label">{t("payments.externalRef")}</span>
                        <span className="payment-success-list__value">{successTransaction.data.externalRef}</span>
                      </li>
                    ) : null}
                    <li className="payment-success-list__row">
                      <span className="payment-success-list__label">{t("payments.fromAccount")}</span>
                      <span className="payment-success-list__value">
                        {successTransaction.data.fromAccountId || "—"}
                      </span>
                    </li>
                    <li className="payment-success-list__row">
                      <span className="payment-success-list__label">{t("payments.toAccount")}</span>
                      <span className="payment-success-list__value">
                        {successTransaction.data.toAccountId || "—"}
                      </span>
                    </li>
                    {successTransaction.md5 ? (
                      <li className="payment-success-list__row payment-success-list__row--code">
                        <span className="payment-success-list__label">{t("payments.md5")}</span>
                        <code className="payment-success-list__code">{successTransaction.md5}</code>
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : null}

              <details className="payment-success-details">
                <summary className="payment-success-details__summary">
                  {t("payments.technicalDetails")}
                </summary>
                <pre className="payment-success-raw">
                  {JSON.stringify(successTransaction, null, 2)}
                </pre>
              </details>
            </div>

            <div className="payment-success-footer">
              <button type="button" className="btn-primary payment-success-done" onClick={() => setSuccessTransaction(null)}>
                {t("payments.done")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
