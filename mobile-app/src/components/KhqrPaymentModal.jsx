import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import KhqrScanCard, { SCREEN_BG } from "./payment/KhqrScanCard";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { PAYMENT_INTENT_TTL_MS } from "../constants/paymentConstants";
import { buildQrImageUri } from "../utils/buildQrImageUri";
import { AbaKhqrLogoMark } from "./payment/PaymentMethodIcons";
import { ABA_KHQR_TEAL } from "../theme/abaKhqrBrand";

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function resolveExpiryMs(expiresAt) {
  if (expiresAt) {
    const expires = new Date(expiresAt);
    if (Number.isFinite(expires.getTime())) {
      return Math.max(0, expires.getTime() - Date.now());
    }
  }
  return PAYMENT_INTENT_TTL_MS;
}

/**
 * KHQR payment screen matching official scan-to-pay layout.
 */
export default function KhqrPaymentModal({
  visible,
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
  const insets = useSafeAreaInsets();
  const paidNotifiedRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(() => resolveExpiryMs(expiresAt));
  const [sessionExpired, setSessionExpired] = useState(() => resolveExpiryMs(expiresAt) <= 0);

  const { status, error } = usePaymentStatus(paymentId, {
    autoRefresh: visible && Boolean(paymentId) && !sessionExpired,
  });

  const isPaid = status === "paid";
  const qrUri = useMemo(() => buildQrImageUri(qrImageUrl, qrString), [qrImageUrl, qrString]);

  useEffect(() => {
    if (!visible) {
      paidNotifiedRef.current = false;
      return undefined;
    }

    const initialMs = resolveExpiryMs(expiresAt);
    setRemainingMs(initialMs);
    setSessionExpired(initialMs <= 0);
    if (initialMs <= 0) return undefined;

    const tick = setInterval(() => {
      const next = resolveExpiryMs(expiresAt);
      setRemainingMs(next);
      if (next <= 0) {
        setSessionExpired(true);
        clearInterval(tick);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [expiresAt, visible]);

  useEffect(() => {
    if (!visible || !isPaid || paidNotifiedRef.current) return;
    paidNotifiedRef.current = true;
    onPaid?.();
  }, [isPaid, onPaid, visible]);

  const handleDownloadQr = useCallback(async () => {
    if (!qrUri && !qrString) {
      Alert.alert(t("payment.khqrNoQr"));
      return;
    }
    try {
      const sharePayload =
        Platform.OS === "ios"
          ? { url: qrUri || undefined, message: qrString || t("payment.downloadQr") }
          : { message: qrUri || qrString || t("payment.downloadQr"), title: t("payment.downloadQr") };
      await Share.share(sharePayload);
    } catch {
      Alert.alert(t("payment.khqrNoQr"));
    }
  }, [qrString, qrUri, t]);

  const statusLabel = t(`payment.result.${status}`, status);
  const statusHint = sessionExpired
    ? t("payment.khqrExpiredHint")
    : isPaid
      ? t("payment.khqrPaidHint")
      : status === "failed"
        ? t("payment.khqrFailedHint")
        : t("payment.khqrChecking", { status: statusLabel });

  const summaryAmount = amountLabel || "—";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>{t("payment.khqrClose")}</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.logoWrap}>
            <AbaKhqrLogoMark size={44} />
          </View>

          {sessionExpired ? (
            <View style={styles.expiredWrap}>
              <Text style={styles.expiredText}>{t("payment.khqrExpired")}</Text>
              <Text style={styles.expiredHint}>{t("payment.khqrExpiredHint")}</Text>
            </View>
          ) : (
            <>
              <KhqrScanCard
                amountLabel={amountLabel}
                qrString={qrString}
                qrImageUrl={qrImageUrl}
                loading={!qrUri && !qrString}
              />

              <Text style={styles.scanTitle}>{t("payment.scanToPay")}</Text>
              <Text style={styles.orText}>{t("payment.or")}</Text>

              <Pressable style={styles.downloadBtn} onPress={() => void handleDownloadQr()}>
                <MaterialCommunityIcons name="download" size={18} color={ABA_KHQR_TEAL} />
                <Text style={styles.downloadText}>{t("payment.downloadQr")}</Text>
              </Pressable>

              <Text style={styles.bankingHint}>{t("payment.khqrBankingHint")}</Text>

              {!sessionExpired && !isPaid ? (
                <Text style={styles.expiry}>
                  {t("payment.khqrExpiresIn", { time: formatCountdown(remainingMs) })}
                </Text>
              ) : null}
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!sessionExpired ? <Text style={styles.statusHint}>{statusHint}</Text> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>{t("payment.subtotal")}</Text>
            <Text style={styles.footerValue}>{summaryAmount}</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerRow}>
            <Text style={styles.footerTotalLabel}>{t("payment.total")}</Text>
            <Text style={styles.footerTotalValue}>{summaryAmount}</Text>
          </View>
        </View>

        {isPaid ? (
          <View style={styles.paidOverlay}>
            <ActivityIndicator color={ABA_KHQR_TEAL} size="large" />
            <Text style={styles.paidText}>{t("payment.khqrPaidHint")}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  closeBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 14,
    fontWeight: "700",
    color: ABA_KHQR_TEAL,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  logoWrap: {
    marginBottom: 20,
    alignItems: "center",
  },
  scanTitle: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  orText: {
    marginTop: 6,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  downloadText: {
    fontSize: 15,
    fontWeight: "700",
    color: ABA_KHQR_TEAL,
  },
  bankingHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  expiry: {
    marginTop: 16,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  statusHint: {
    marginTop: 8,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
  },
  expiredWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  expiredText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#DC2626",
  },
  expiredHint: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#C4C4CE",
    backgroundColor: SCREEN_BG,
    paddingTop: 14,
    paddingHorizontal: 24,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  footerLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  footerValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  footerDivider: {
    height: 1,
    backgroundColor: "#C4C4CE",
    marginVertical: 6,
  },
  footerTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  footerTotalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  paidOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(243,244,246,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  paidText: {
    marginTop: 12,
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
});
