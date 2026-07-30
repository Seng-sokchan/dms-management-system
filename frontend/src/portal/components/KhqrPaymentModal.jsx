import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { PAYMENT_INTENT_TTL_MS } from "../constants/paymentConstants";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
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

function parseAmountLabel(amountLabel) {
  const raw = String(amountLabel || "").trim();
  if (!raw) return { value: "—", unit: "" };
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    return { value: parts.slice(0, -1).join(" "), unit: parts[parts.length - 1] };
  }
  return { value: raw, unit: "" };
}

function KhqrWordmark() {
  return (
    <svg className="khqr-aba__wordmark" viewBox="0 0 120 28" role="img" aria-label="KHQR">
      <text
        x="0"
        y="22"
        fill="#fff"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="24"
        fontWeight="900"
        letterSpacing="1"
      >
        KHQR
      </text>
    </svg>
  );
}

function BackChevron() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 5L8 12l7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SokleapLogo({ alt }) {
  return (
    <img
      className="khqr-aba__merchant-logo"
      src="/logo.png"
      alt={alt || "Sokleap"}
      width={64}
      height={64}
    />
  );
}

function CurrencyBadge({ unit }) {
  const isUsd = String(unit || "").toUpperCase() === "USD";
  return (
    <span className="khqr-aba__qr-badge" aria-hidden>
      {isUsd ? "$" : "៛"}
    </span>
  );
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
  const { value: amountValue, unit: amountUnit } = useMemo(
    () => parseAmountLabel(amountLabel),
    [amountLabel],
  );
  const displayAmount = amountLabel || "—";
  const showLocalQrBadge = Boolean(qrDataUrl) && !qrImageUrl;

  useEffect(() => {
    if (!visible || !qrString) {
      setQrDataUrl("");
      return undefined;
    }
    let cancelled = false;
    QRCode.toDataURL(qrString, {
      width: 280,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
    })
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
  const titleMerchant = merchantName || t("portal.payment.storeName");

  return (
    <div className="khqr-aba-backdrop" role="dialog" aria-modal="true" aria-labelledby="khqr-aba-title">
      <section className="khqr-aba">
        <header className="khqr-aba__top">
          <button type="button" className="khqr-aba__back" onClick={onClose} aria-label={t("portal.payment.khqrClose")}>
            <BackChevron />
          </button>
          <h2 id="khqr-aba-title" className="khqr-aba__title">
            {t("portal.payment.methodAbaKhqr")}
          </h2>
          <span className="khqr-aba__top-spacer" aria-hidden />
        </header>

        <SokleapLogo alt={titleMerchant} />

        <div className="khqr-aba__card">
          <div className="khqr-aba__banner">
            <KhqrWordmark />
          </div>

          <div className="khqr-aba__card-body">
            <p className="khqr-aba__merchant">{titleMerchant}</p>
            <p className="khqr-aba__amount">
              <span className="khqr-aba__amount-value">{amountValue}</span>
              {amountUnit ? <span className="khqr-aba__amount-unit">{amountUnit}</span> : null}
            </p>

            <div className="khqr-aba__dash" aria-hidden />

            <div className="khqr-aba__qr">
              {imageSrc ? (
                <>
                  <img src={imageSrc} alt="KHQR" width={260} height={260} />
                  {showLocalQrBadge ? <CurrencyBadge unit={amountUnit} /> : null}
                </>
              ) : (
                <p className="khqr-aba__qr-empty">{t("portal.payment.khqrNoQr")}</p>
              )}
            </div>
          </div>
        </div>

        <p className="khqr-aba__scan">{t("portal.payment.khqrScanToPay")}</p>

        {!isPaid && !isExpired ? (
          <p className="khqr-aba__meta">{t("portal.payment.khqrExpiresIn", { time: formatCountdown(remainingMs) })}</p>
        ) : null}
        {isPaid ? <p className="khqr-aba__meta khqr-aba__meta--ok">{t("portal.payment.khqrPaidHint")}</p> : null}
        {isExpired && !isPaid ? (
          <p className="khqr-aba__meta khqr-aba__meta--warn">{t("portal.payment.khqrExpiredHint")}</p>
        ) : null}
        {error ? <p className="khqr-aba__meta khqr-aba__meta--warn">{error}</p> : null}
        <p className="khqr-aba__meta khqr-aba__meta--muted">
          {t("portal.payment.khqrChecking", { status })}
        </p>

        <div className="khqr-aba__summary">
          <div className="khqr-aba__summary-row">
            <span>{t("portal.payment.khqrSubtotal")}</span>
            <span>{displayAmount}</span>
          </div>
          <div className="khqr-aba__summary-dash" aria-hidden />
          <div className="khqr-aba__summary-row khqr-aba__summary-row--total">
            <span>{t("portal.payment.total")}</span>
            <span>{displayAmount}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
