import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { PAYMENT_INTENT_TTL_MS } from "../constants/paymentConstants";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { PortalButton } from "./PortalButton";
import "./KhqrPaymentModal.css";

function resolveExpiryMs(expiresAt) {
  if (expiresAt) {
    const expires = new Date(expiresAt);
    if (Number.isFinite(expires.getTime())) {
      return Math.max(0, expires.getTime() - Date.now());
    }
  }
  return PAYMENT_INTENT_TTL_MS;
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function KhqrPaymentModal({
  visible,
  token,
  paymentId,
  qrString,
  qrImageUrl,
  expiresAt,
  amountLabel,
  merchantName,
  onClose,
  onPaid,
}) {
  const { t } = useTranslation();
  const paidNotifiedRef = useRef(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [remainingMs, setRemainingMs] = useState(() => resolveExpiryMs(expiresAt));
  const [sessionExpired, setSessionExpired] = useState(() => resolveExpiryMs(expiresAt) <= 0);

  const { status, error } = usePaymentStatus(token, paymentId, {
    autoRefresh: visible && Boolean(paymentId) && !sessionExpired,
  });

  const isPaid = status === "paid";
  const isExpired = sessionExpired || status === "expired";

  useEffect(() => {
    if (!visible || !qrString) {
      setQrDataUrl("");
      return undefined;
    }
    let cancelled = false;
    QRCode.toDataURL(qrString, { width: 280, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [qrString, visible]);

  useEffect(() => {
    if (status === "expired") setSessionExpired(true);
  }, [status]);

  useEffect(() => {
    if (!visible) {
      paidNotifiedRef.current = false;
      return undefined;
    }

    const initialMs = resolveExpiryMs(expiresAt);
    setRemainingMs(initialMs);
    setSessionExpired(initialMs <= 0);
    if (initialMs <= 0) return undefined;

    const started = Date.now();
    const tick = window.setInterval(() => {
      const left = Math.max(0, initialMs - (Date.now() - started));
      setRemainingMs(left);
      if (left <= 0) {
        setSessionExpired(true);
        window.clearInterval(tick);
      }
    }, 1000);

    return () => window.clearInterval(tick);
  }, [expiresAt, visible]);

  useEffect(() => {
    if (!visible || !isPaid || paidNotifiedRef.current) return;
    paidNotifiedRef.current = true;
    onPaid?.();
  }, [isPaid, onPaid, visible]);

  if (!visible) return null;

  const imageSrc = qrImageUrl || qrDataUrl;

  return (
    <div className="khqr-modal-backdrop" role="dialog" aria-modal="true">
      <section className="khqr-modal">
        <div className="khqr-modal-header">KHQR</div>
        <p className="khqr-modal-merchant">{merchantName || t("portal.payment.khqrTitle")}</p>
        {amountLabel ? <p className="khqr-modal-amount">{amountLabel}</p> : null}
        <p className="khqr-modal-hint">{t("portal.payment.khqrScanHint")}</p>

        <div className="khqr-modal-qr">
          {imageSrc ? (
            <img src={imageSrc} alt="KHQR" width={280} height={280} />
          ) : (
            <p>{t("portal.payment.khqrNoQr")}</p>
          )}
        </div>

        {!isPaid && !isExpired ? (
          <p className="khqr-modal-timer">
            {t("portal.payment.khqrExpiresIn", { time: formatCountdown(remainingMs) })}
          </p>
        ) : null}
        {isPaid ? <p className="khqr-modal-ok">{t("portal.payment.khqrPaidHint")}</p> : null}
        {isExpired && !isPaid ? (
          <p className="khqr-modal-warn">{t("portal.payment.khqrExpiredHint")}</p>
        ) : null}
        {error ? <p className="khqr-modal-warn">{error}</p> : null}
        <p className="khqr-modal-status">
          {t("portal.payment.khqrChecking", { status })}
        </p>

        <div className="khqr-modal-actions">
          <PortalButton tone="soft" onClick={onClose}>
            {t("portal.payment.khqrClose")}
          </PortalButton>
        </div>
      </section>
    </div>
  );
}
