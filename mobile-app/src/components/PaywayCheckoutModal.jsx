import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { API_BASE_URL } from "../config/appConfig";
import { PAYMENT_INTENT_TTL_MS } from "../constants/paymentConstants";
import { buildQrImageUri } from "../utils/buildQrImageUri";
import { submitPaymentPurchase } from "../services/paymentsApi";
import { submitPaywayCheckoutForm } from "../utils/paywayCheckoutClient";
import KhqrScanCard, { SCREEN_BG } from "./payment/KhqrScanCard";
import KhqrCheckoutHeader from "./payment/KhqrCheckoutHeader";
import KhqrCheckoutFooter from "./payment/KhqrCheckoutFooter";
import { ABA_KHQR_TEAL } from "../theme/abaKhqrBrand";

function resolveExpiryMs(expiresAt) {
  if (expiresAt) {
    const expires = new Date(expiresAt);
    if (Number.isFinite(expires.getTime())) {
      return Math.max(0, expires.getTime() - Date.now());
    }
  }
  return PAYMENT_INTENT_TTL_MS;
}

function shouldOpenExternally(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.startsWith("abamobilebank://") ||
    lower.startsWith("intent://") ||
    lower.startsWith("market://")
  );
}

export default function PaywayCheckoutModal({
  visible,
  paymentId,
  paywayCheckout,
  checkoutQrUrl: checkoutQrUrlProp,
  expiresAt,
  amountLabel,
  merchantName,
  skipAutoFallback = false,
  onClose,
  onPaid,
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const paidNotifiedRef = useRef(false);
  const fallbackStartedRef = useRef(false);
  const [webError, setWebError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackPurchase, setFallbackPurchase] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(() => resolveExpiryMs(expiresAt) <= 0);

  const hostedCheckoutUri = useMemo(() => {
    const fromProp = typeof checkoutQrUrlProp === "string" ? checkoutQrUrlProp.trim() : "";
    if (fromProp) return fromProp;
    const fromPurchase = fallbackPurchase?.checkoutQrUrl;
    return typeof fromPurchase === "string" && fromPurchase.trim() ? fromPurchase.trim() : null;
  }, [checkoutQrUrlProp, fallbackPurchase?.checkoutQrUrl]);

  const checkoutPageUri = useMemo(() => {
    if (hostedCheckoutUri) return hostedCheckoutUri;
    if (!paymentId || !token) return null;
    const params = new URLSearchParams({ token });
    return `${API_BASE_URL}/payments/${encodeURIComponent(paymentId)}/checkout-page?${params.toString()}`;
  }, [hostedCheckoutUri, paymentId, token]);

  const { status, error } = usePaymentStatus(paymentId, {
    autoRefresh: visible && Boolean(paymentId) && !sessionExpired,
  });

  const isPaid = status === "paid";
  const isExpired = sessionExpired || status === "expired";
  const showNativeLayout = useFallback || isExpired;

  useEffect(() => {
    if (status === "expired") {
      setSessionExpired(true);
    }
  }, [status]);

  const loadFallbackCheckout = useCallback(async () => {
    if ((!paywayCheckout && !(token && paymentId)) || fallbackStartedRef.current) return;
    fallbackStartedRef.current = true;
    setUseFallback(true);
    setFallbackLoading(true);
    setWebError(null);
    try {
      const parsed =
        token && paymentId
          ? await submitPaymentPurchase(token, paymentId)
          : await submitPaywayCheckoutForm(paywayCheckout);
      setFallbackPurchase(parsed);
      if (parsed?.checkoutQrUrl) {
        setUseFallback(false);
      }
    } catch (err) {
      setWebError(err?.message || t("payment.checkoutUnavailable"));
    } finally {
      setFallbackLoading(false);
    }
  }, [paywayCheckout, paymentId, t, token]);

  useEffect(() => {
    if (!visible) {
      paidNotifiedRef.current = false;
      fallbackStartedRef.current = false;
      setWebError(null);
      setUseFallback(false);
      setFallbackPurchase(null);
      setFallbackLoading(false);
      return undefined;
    }

    const initialMs = resolveExpiryMs(expiresAt);
    setSessionExpired(initialMs <= 0);
    if (initialMs <= 0) return undefined;

    const tick = setTimeout(() => {
      setSessionExpired(resolveExpiryMs(expiresAt) <= 0);
    }, initialMs);

    let watchdog;
    if (!skipAutoFallback) {
      watchdog = setTimeout(() => {
        if (!fallbackStartedRef.current && paywayCheckout) {
          void loadFallbackCheckout();
        }
      }, 12000);
    }

    return () => {
      clearTimeout(tick);
      if (watchdog) clearTimeout(watchdog);
    };
  }, [expiresAt, loadFallbackCheckout, paywayCheckout, skipAutoFallback, visible]);

  useEffect(() => {
    if (!visible || !isPaid || paidNotifiedRef.current) return;
    paidNotifiedRef.current = true;
    onPaid?.();
  }, [isPaid, onPaid, visible]);

  const handleWebViewMessage = (event) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === "payway:timeout" || payload?.type === "payway:error") {
        void loadFallbackCheckout();
      }
    } catch {
      // Ignore non-JSON messages from PayWay scripts.
    }
  };

  const handleShouldStartLoad = (request) => {
    const { url } = request;
    if (shouldOpenExternally(url)) {
      void Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  };

  const qrUri = useMemo(
    () => buildQrImageUri(fallbackPurchase?.qrImageUrl, fallbackPurchase?.qrString),
    [fallbackPurchase?.qrImageUrl, fallbackPurchase?.qrString],
  );

  const showErrorBanner = Boolean((webError && !useFallback) || error);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KhqrCheckoutHeader onClose={onClose} />

        {isExpired ? (
          <View style={styles.center}>
            <Text style={styles.error}>{t("payment.khqrExpired")}</Text>
          </View>
        ) : useFallback ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {fallbackLoading ? (
              <ActivityIndicator color={ABA_KHQR_TEAL} size="large" />
            ) : fallbackPurchase?.qrString || fallbackPurchase?.qrImageUrl || qrUri ? (
              <>
                <KhqrScanCard
                  amountLabel={amountLabel}
                  merchantName={merchantName}
                  qrString={fallbackPurchase?.qrString}
                  qrImageUrl={fallbackPurchase?.qrImageUrl}
                />
                <Text style={styles.scanTitle}>{t("payment.scanToPay")}</Text>
              </>
            ) : (
              <Text style={styles.error}>{webError || t("payment.checkoutUnavailable")}</Text>
            )}
          </ScrollView>
        ) : !checkoutPageUri ? (
          <View style={styles.center}>
            <Text style={styles.error}>{t("payment.checkoutUnavailable")}</Text>
          </View>
        ) : (
          <WebView
            key={checkoutPageUri}
            style={styles.webview}
            originWhitelist={["*"]}
            source={{ uri: checkoutPageUri }}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            allowsInlineMediaPlayback
            javaScriptCanOpenWindowsAutomatically
            setSupportMultipleWindows
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            onMessage={handleWebViewMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onError={() => void loadFallbackCheckout()}
            onHttpError={() => void loadFallbackCheckout()}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.center}>
                <ActivityIndicator color={ABA_KHQR_TEAL} size="large" />
              </View>
            )}
          />
        )}

        {showErrorBanner ? (
          <View style={styles.errorBanner}>
            {webError && !useFallback ? <Text style={styles.error}>{webError}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : null}

        {showNativeLayout && !isExpired ? <KhqrCheckoutFooter amountLabel={amountLabel} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  webview: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  scanTitle: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  errorBanner: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
});
