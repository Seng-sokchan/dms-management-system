import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { API_BASE_URL } from "../config/appConfig";
import { PAYMENT_INTENT_TTL_MS } from "../constants/paymentConstants";
import { buildQrImageUri } from "../utils/buildQrImageUri";
import { submitPaywayCheckoutForm } from "../utils/paywayCheckoutClient";
import KhqrScanCard, { SCREEN_BG } from "./payment/KhqrScanCard";
import { AbaKhqrLogoMark } from "./payment/PaymentMethodIcons";
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
  expiresAt,
  amountLabel,
  merchantName,
  skipAutoFallback = false,
  onClose,
  onPaid,
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const paidNotifiedRef = useRef(false);
  const fallbackStartedRef = useRef(false);
  const [webError, setWebError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackPurchase, setFallbackPurchase] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(() => resolveExpiryMs(expiresAt) <= 0);

  const checkoutPageUri = useMemo(() => {
    if (!paymentId || !token) return null;
    const params = new URLSearchParams({ token });
    return `${API_BASE_URL}/payments/${encodeURIComponent(paymentId)}/checkout-page?${params.toString()}`;
  }, [paymentId, token]);

  const { status, error } = usePaymentStatus(paymentId, {
    autoRefresh: visible && Boolean(paymentId) && !sessionExpired,
  });

  const isPaid = status === "paid";
  const isExpired = sessionExpired || status === "expired";
  const storeName = merchantName || t("payment.storeName");

  useEffect(() => {
    if (status === "expired") {
      setSessionExpired(true);
    }
  }, [status]);

  const loadFallbackCheckout = useCallback(async () => {
    if (!paywayCheckout || fallbackStartedRef.current) return;
    fallbackStartedRef.current = true;
    setUseFallback(true);
    setFallbackLoading(true);
    setWebError(null);
    try {
      const parsed = await submitPaywayCheckoutForm(paywayCheckout);
      setFallbackPurchase(parsed);
    } catch (err) {
      setWebError(err?.message || t("payment.checkoutUnavailable"));
    } finally {
      setFallbackLoading(false);
    }
  }, [paywayCheckout, t]);

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: SCREEN_BG,
        },
        header: {
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          alignItems: "center",
        },
        closeBtn: {
          position: "absolute",
          right: spacing.lg,
          top: insets.top + spacing.sm,
          padding: spacing.xs,
        },
        closeText: {
          fontSize: typography.bodySmall,
          fontWeight: "700",
          color: ABA_KHQR_TEAL,
        },
        title: {
          marginTop: spacing.sm,
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        amount: {
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
        },
        webview: {
          flex: 1,
          backgroundColor: SCREEN_BG,
        },
        center: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        },
        qrImage: {
          width: 240,
          height: 240,
          backgroundColor: "#fff",
        },
        scanTitle: {
          marginTop: spacing.lg,
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
          textAlign: "center",
        },
        hint: {
          marginTop: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.md,
        },
        hintText: {
          fontSize: typography.caption,
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 18,
        },
        error: {
          color: colors.danger,
          fontSize: typography.bodySmall,
          textAlign: "center",
        },
      }),
    [colors, insets.bottom, insets.top, spacing, typography],
  );

  const statusLabel = t(`payment.result.${status}`, status);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>{t("payment.checkoutWebClose")}</Text>
          </Pressable>
          <AbaKhqrLogoMark size={40} />
          <Text style={styles.title}>{storeName}</Text>
          {amountLabel ? <Text style={styles.amount}>{amountLabel}</Text> : null}
        </View>

        {isExpired ? (
          <View style={styles.center}>
            <Text style={styles.error}>{t("payment.khqrExpired")}</Text>
          </View>
        ) : useFallback ? (
          <View style={styles.center}>
            {fallbackLoading ? (
              <ActivityIndicator color={ABA_KHQR_TEAL} size="large" />
            ) : fallbackPurchase?.qrString || fallbackPurchase?.qrImageUrl || qrUri ? (
              <>
                <KhqrScanCard
                  amountLabel={amountLabel}
                  qrString={fallbackPurchase?.qrString}
                  qrImageUrl={fallbackPurchase?.qrImageUrl}
                />
                <Text style={styles.scanTitle}>{t("payment.scanToPay")}</Text>
              </>
            ) : (
              <Text style={styles.error}>{webError || t("payment.checkoutUnavailable")}</Text>
            )}
          </View>
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

        <View style={styles.hint}>
          {webError && !useFallback ? <Text style={styles.error}>{webError}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.hintText}>
            {isPaid
              ? t("payment.khqrPaidHint")
              : isExpired
                ? t("payment.khqrExpired")
                : t("payment.checkoutWebHint", { status: statusLabel })}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
