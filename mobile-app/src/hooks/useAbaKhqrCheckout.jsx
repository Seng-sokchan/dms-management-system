import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import KhqrPaymentModal from "../components/KhqrPaymentModal";
import PaywayCheckoutModal from "../components/PaywayCheckoutModal";
import { useAlert } from "../context/AlertContext";
import { usePaymentStatus } from "./usePaymentStatus";
import { getApiErrorMessage } from "../services/apiClient";
import { startPaymentLiveCheck, stopPaymentLiveCheck } from "../services/paymentsApi";
import { setPendingPaymentReturn } from "../services/paymentPendingStorage";
import { isIntentExpired } from "../utils/paymentReturnRouting";
import { openAbaPaywayCheckout } from "../utils/openAbaPayway";
import { resolveAbaPaymentRoute } from "../utils/resolveAbaPaymentRoute";
import { resolvePaywayCheckoutIntent } from "../utils/resolvePaywayCheckoutIntent";
import { ABA_KHQR_TEAL } from "../theme/abaKhqrBrand";

/**
 * Shared ABA KHQR checkout: open ABA Mobile when installed; otherwise show PayWay hosted
 * checkout (checkout_qr_url) in a WebView. Local KHQR card is only used if hosted URL is missing.
 */
export function useAbaKhqrCheckout({
  token,
  user,
  amountLabel,
  merchantName,
  buildPendingReturn,
  onPaymentSuccess,
  resumePaymentLookup,
}) {
  const { t } = useTranslation();
  const { showError, showWarning } = useAlert();
  const [submitting, setSubmitting] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(null);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [qrPayload, setQrPayload] = useState(null);
  const [confirmingAba, setConfirmingAba] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState(null);
  const paidViaAbaRef = useRef(false);

  const checkoutVisible = checkoutMode === "khqr_qr" || checkoutMode === "webview";
  const pollWhileConfirming = Boolean(activePaymentId) && (confirmingAba || !checkoutVisible);

  const { status: polledStatus } = usePaymentStatus(activePaymentId, {
    autoRefresh: pollWhileConfirming,
  });

  const resetCheckout = useCallback(() => {
    setCheckoutMode(null);
    setCheckoutSession(null);
    setQrPayload(null);
    setConfirmingAba(false);
    paidViaAbaRef.current = false;
  }, []);

  const goToSuccess = useCallback(
    (paymentId, { fromAbaReturn = false } = {}) => {
      if (!paymentId) return;
      resetCheckout();
      setActivePaymentId(null);
      onPaymentSuccess?.(paymentId, { fromAbaReturn });
    },
    [onPaymentSuccess, resetCheckout],
  );

  useEffect(() => {
    if (polledStatus === "paid" && activePaymentId) {
      goToSuccess(activePaymentId, { fromAbaReturn: paidViaAbaRef.current || confirmingAba });
    }
  }, [activePaymentId, confirmingAba, goToSuccess, polledStatus]);

  useEffect(() => {
    if (polledStatus !== "expired" || !activePaymentId) return;
    showWarning(t("payment.khqrExpired"), t("payment.khqrExpiredHint"));
    const paymentId = activePaymentId;
    resetCheckout();
    setActivePaymentId(null);
    if (token && paymentId) {
      void stopPaymentLiveCheck(token, paymentId).catch(() => {});
    }
  }, [activePaymentId, polledStatus, resetCheckout, showWarning, t, token]);

  useEffect(() => {
    if (!token || !resumePaymentLookup) return;
    void resumePaymentLookup(token).then((paymentId) => {
      if (paymentId) setActivePaymentId(paymentId);
    });
  }, [resumePaymentLookup, token]);

  const openWebviewFallback = useCallback((resolved) => {
    setCheckoutSession(resolved);
    setCheckoutMode("webview");
    setConfirmingAba(false);
  }, []);

  const openCheckoutSession = useCallback(
    async (intent) => {
      if (isIntentExpired(intent?.expiresAt)) {
        showError(t("payment.intentFailed"), t("payment.intentFailed"));
        return;
      }

      const resolved = await resolvePaywayCheckoutIntent(token, intent);
      if (!resolved?.paywayCheckout) {
        showError(t("payment.intentFailed"), t("payment.checkoutUnavailable"));
        return;
      }

      setActivePaymentId(resolved.paymentId);
      if (token) {
        void startPaymentLiveCheck(token, resolved.paymentId).catch(() => {});
      }
      await setPendingPaymentReturn(buildPendingReturn(resolved));
      setCheckoutSession(resolved);

      let route;
      try {
        route = await resolveAbaPaymentRoute(resolved, token);
      } catch (err) {
        showError(t("payment.intentFailed"), getApiErrorMessage(err, t("payment.checkoutUnavailable")));
        openWebviewFallback(resolved);
        return;
      }

      setQrPayload({
        qrString: route.qrString,
        qrImageUrl: route.qrImageUrl,
        checkoutQrUrl: route.checkoutQrUrl,
      });

      if (route.mode === "aba_app") {
        const result = await openAbaPaywayCheckout(
          {
            deeplinkUrl: route.deeplinkUrl,
            playStoreUrl: route.playStoreUrl,
            appStoreUrl: route.appStoreUrl,
          },
          { t, fallbackToStore: false },
        );
        if (result.opened === "aba") {
          paidViaAbaRef.current = true;
          setConfirmingAba(true);
          setCheckoutMode(null);
          return;
        }
        // Deeplink failed → fall through to hosted checkout / KHQR.
      }

      if (route.mode === "webview" || route.checkoutQrUrl) {
        setCheckoutMode("webview");
        return;
      }

      // ABA missing / deeplink failed and no hosted URL → show KHQR scan UI.
      setCheckoutMode("khqr_qr");
    },
    [buildPendingReturn, openWebviewFallback, showError, t, token],
  );

  const startCheckout = useCallback(
    async (createIntentFn) => {
      if (!token) return;
      setSubmitting(true);
      resetCheckout();
      let intent;
      try {
        intent = await createIntentFn();
      } catch (err) {
        showError(t("payment.intentFailed"), getApiErrorMessage(err, t("payment.intentFailed")));
        setSubmitting(false);
        return;
      }

      try {
        await openCheckoutSession(intent);
      } catch (err) {
        showError(t("payment.intentFailed"), getApiErrorMessage(err, t("payment.intentFailed")));
      } finally {
        setSubmitting(false);
      }
    },
    [openCheckoutSession, resetCheckout, showError, t, token],
  );

  const handleCheckoutPaid = useCallback(() => {
    if (!checkoutSession?.paymentId) return;
    goToSuccess(checkoutSession.paymentId, { fromAbaReturn: paidViaAbaRef.current });
  }, [checkoutSession?.paymentId, goToSuccess]);

  const handleCheckoutClose = useCallback(() => {
    const paymentId = checkoutSession?.paymentId;
    resetCheckout();
    setActivePaymentId(null);
    if (token && paymentId) {
      void stopPaymentLiveCheck(token, paymentId).catch(() => {});
    }
  }, [checkoutSession?.paymentId, resetCheckout, token]);

  const handleKhqrPaid = handleCheckoutPaid;
  const handleKhqrClose = handleCheckoutClose;

  const confirmingOverlay = confirmingAba ? (
    <Modal visible transparent animationType="fade">
      <View style={confirmingStyles.backdrop}>
        <ActivityIndicator color={ABA_KHQR_TEAL} size="large" />
        <Text style={confirmingStyles.text}>{t("payment.confirmingAfterAba")}</Text>
      </View>
    </Modal>
  ) : null;

  const checkoutModals = (
    <>
      <KhqrPaymentModal
        visible={checkoutMode === "khqr_qr"}
        paymentId={checkoutSession?.paymentId}
        qrString={qrPayload?.qrString}
        qrImageUrl={qrPayload?.qrImageUrl}
        expiresAt={checkoutSession?.expiresAt}
        amountLabel={amountLabel}
        merchantName={merchantName}
        onClose={handleKhqrClose}
        onPaid={handleKhqrPaid}
      />
      <PaywayCheckoutModal
        visible={checkoutMode === "webview"}
        paymentId={checkoutSession?.paymentId}
        paywayCheckout={checkoutSession?.paywayCheckout}
        checkoutQrUrl={qrPayload?.checkoutQrUrl}
        expiresAt={checkoutSession?.expiresAt}
        amountLabel={amountLabel}
        merchantName={merchantName}
        skipAutoFallback
        onClose={handleCheckoutClose}
        onPaid={handleCheckoutPaid}
      />
      {confirmingOverlay}
    </>
  );

  return {
    submitting,
    startCheckout,
    checkoutModals,
    activePaymentId,
  };
}

const confirmingStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    color: "#fff",
    textAlign: "center",
    lineHeight: 22,
  },
});
