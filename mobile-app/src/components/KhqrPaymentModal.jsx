import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import KhqrScanCard, { SCREEN_BG } from "./payment/KhqrScanCard";
import KhqrCheckoutHeader from "./payment/KhqrCheckoutHeader";
import KhqrCheckoutFooter from "./payment/KhqrCheckoutFooter";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { PAYMENT_INTENT_TTL_MS } from "../constants/paymentConstants";
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
  const paidNotifiedRef = useRef(false);
  const [sessionExpired, setSessionExpired] = useState(() => resolveExpiryMs(expiresAt) <= 0);

  const { status, error } = usePaymentStatus(paymentId, {
    autoRefresh: visible && Boolean(paymentId) && !sessionExpired,
  });

  const isPaid = status === "paid";
  const isExpired = sessionExpired || status === "expired";

  useEffect(() => {
    if (status === "expired") {
      setSessionExpired(true);
    }
  }, [status]);

  useEffect(() => {
    if (!visible) {
      paidNotifiedRef.current = false;
      return undefined;
    }

    const initialMs = resolveExpiryMs(expiresAt);
    setSessionExpired(initialMs <= 0);
    if (initialMs <= 0) return undefined;

    const tick = setTimeout(() => {
      setSessionExpired(resolveExpiryMs(expiresAt) <= 0);
    }, initialMs);

    return () => clearTimeout(tick);
  }, [expiresAt, visible]);

  useEffect(() => {
    if (!visible || !isPaid || paidNotifiedRef.current) return;
    paidNotifiedRef.current = true;
    onPaid?.();
  }, [isPaid, onPaid, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <KhqrCheckoutHeader onClose={onClose} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {isExpired ? (
            <View style={styles.expiredWrap}>
              <Text style={styles.expiredText}>{t("payment.khqrExpired")}</Text>
              <Text style={styles.expiredHint}>{t("payment.khqrExpiredHint")}</Text>
            </View>
          ) : (
            <>
              <KhqrScanCard
                amountLabel={amountLabel}
                merchantName={merchantName}
                qrString={qrString}
                qrImageUrl={qrImageUrl}
                loading={!qrString && !qrImageUrl}
              />
              <Text style={styles.scanTitle}>{t("payment.scanToPay")}</Text>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        {!isExpired ? <KhqrCheckoutFooter amountLabel={amountLabel} /> : null}

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
