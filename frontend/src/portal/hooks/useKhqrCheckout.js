import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  startPaymentLiveCheck,
  stopPaymentLiveCheck,
  submitPaymentPurchase,
} from "../services/payments";
import { usePaymentStatus } from "./usePaymentStatus";

/**
 * Web KHQR-only checkout: purchase → local QR → poll until paid.
 * Never opens ABA deeplink or hosted checkout.
 */
export function useKhqrCheckout({ token, amountLabel, merchantName, onPaymentSuccess }) {
  const { t } = useTranslation();
  const { alert } = useConfirm();
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [session, setSession] = useState(null);
  const [qrPayload, setQrPayload] = useState(null);
  const [activePaymentId, setActivePaymentId] = useState(null);

  const { status: polledStatus } = usePaymentStatus(token, activePaymentId, {
    autoRefresh: Boolean(activePaymentId) && visible,
  });

  const resetCheckout = useCallback(() => {
    setVisible(false);
    setSession(null);
    setQrPayload(null);
  }, []);

  const goToSuccess = useCallback(
    (paymentId) => {
      if (!paymentId) return;
      resetCheckout();
      setActivePaymentId(null);
      onPaymentSuccess?.(paymentId);
    },
    [onPaymentSuccess, resetCheckout],
  );

  useEffect(() => {
    if (polledStatus === "paid" && activePaymentId) {
      goToSuccess(activePaymentId);
    }
  }, [activePaymentId, goToSuccess, polledStatus]);

  useEffect(() => {
    if (polledStatus !== "expired" || !activePaymentId) return;
    void alert({
      title: t("portal.payment.khqrExpired"),
      message: t("portal.payment.khqrExpiredHint"),
      tone: "primary",
    });
    const paymentId = activePaymentId;
    resetCheckout();
    setActivePaymentId(null);
    if (token && paymentId) {
      void stopPaymentLiveCheck(token, paymentId).catch(() => {});
    }
  }, [activePaymentId, alert, polledStatus, resetCheckout, t, token]);

  const startCheckout = useCallback(
    async (createIntentFn) => {
      if (!token) return;
      setSubmitting(true);
      resetCheckout();
      try {
        const intent = await createIntentFn();
        const paymentId = intent?.paymentId;
        if (!paymentId) {
          throw new Error(t("portal.payment.intentFailed"));
        }

        const purchase = await submitPaymentPurchase(token, paymentId);
        const qrString = purchase?.qrString || "";
        const qrImageUrl = purchase?.qrImageUrl || "";
        if (!qrString && !qrImageUrl) {
          throw new Error(t("portal.payment.khqrNoData"));
        }

        setSession({
          paymentId,
          expiresAt: intent?.expiresAt,
          amountLabel,
          merchantName,
        });
        setQrPayload({ qrString, qrImageUrl });
        setActivePaymentId(paymentId);
        void startPaymentLiveCheck(token, paymentId).catch(() => {});
        setVisible(true);
      } catch (err) {
        await alert({
          title: t("portal.payment.intentFailed"),
          message: getApiErrorMessage(err, t("portal.payment.intentFailed")),
          tone: "primary",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [alert, amountLabel, merchantName, resetCheckout, t, token],
  );

  const handleClose = useCallback(() => {
    const paymentId = session?.paymentId || activePaymentId;
    resetCheckout();
    setActivePaymentId(null);
    if (token && paymentId) {
      void stopPaymentLiveCheck(token, paymentId).catch(() => {});
    }
  }, [activePaymentId, resetCheckout, session?.paymentId, token]);

  return {
    submitting,
    startCheckout,
    khqrModalProps: {
      visible,
      paymentId: session?.paymentId,
      qrString: qrPayload?.qrString,
      qrImageUrl: qrPayload?.qrImageUrl,
      expiresAt: session?.expiresAt,
      amountLabel: session?.amountLabel || amountLabel,
      merchantName: session?.merchantName || merchantName,
      onClose: handleClose,
      onPaid: () => {
        if (session?.paymentId) goToSuccess(session.paymentId);
      },
      token,
    },
  };
}
