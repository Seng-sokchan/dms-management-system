import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { usePaymentStatus } from "../hooks/usePaymentStatus";

export const KHQR_EXPIRY_MS = 5 * 60 * 1000;

const TERMINAL = new Set(["paid", "failed", "expired", "cancelled"]);

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function buildQrImageUri(qrImageUrl, qrString) {
  const url = qrImageUrl ? String(qrImageUrl).trim() : "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const payload = qrString ? String(qrString).trim() : "";
  if (!payload) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}`;
}

function resolveExpiryMs(expiresAt) {
  if (expiresAt) {
    const expires = new Date(expiresAt);
    if (Number.isFinite(expires.getTime())) {
      return Math.max(0, expires.getTime() - Date.now());
    }
  }
  return KHQR_EXPIRY_MS;
}

/**
 * KHQR payment popup: intent expiry from backend, status poll via usePaymentStatus.
 */
export default function KhqrPaymentModal({
  visible,
  paymentId,
  qrString,
  qrImageUrl,
  expiresAt,
  amountLabel,
  onClose,
  onPaid,
}) {
  const { t } = useTranslation();
  const { colors, layout, radii, sizes, spacing, typography } = useTheme();
  const paidNotifiedRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(() => resolveExpiryMs(expiresAt));
  const [qrExpired, setQrExpired] = useState(() => resolveExpiryMs(expiresAt) <= 0);

  const { status, error } = usePaymentStatus(paymentId, {
    autoRefresh: visible && Boolean(paymentId) && !qrExpired,
  });

  const qrUri = useMemo(() => buildQrImageUri(qrImageUrl, qrString), [qrImageUrl, qrString]);
  const isPaid = status === "paid";
  const isFailed = TERMINAL.has(status) && !isPaid;
  const showStatusRow = isPaid || isFailed;

  useEffect(() => {
    if (!visible) {
      paidNotifiedRef.current = false;
      return undefined;
    }
    if (!paymentId) return undefined;

    const initialMs = resolveExpiryMs(expiresAt);
    setRemainingMs(initialMs);
    setQrExpired(initialMs <= 0);

    if (initialMs <= 0) return undefined;

    const tick = setInterval(() => {
      const left = resolveExpiryMs(expiresAt);
      if (left <= 0) {
        setRemainingMs(0);
        setQrExpired(true);
        clearInterval(tick);
        return;
      }
      setRemainingMs(left);
    }, 1000);

    return () => clearInterval(tick);
  }, [visible, paymentId, expiresAt]);

  useEffect(() => {
    if (!visible || !isPaid || paidNotifiedRef.current) return;
    paidNotifiedRef.current = true;
    onPaid?.();
  }, [visible, isPaid, onPaid]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.overlay,
          padding: spacing.lg,
        },
        card: {
          width: "100%",
          maxWidth: layout.modalMaxWidth,
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          padding: spacing.xl,
          alignItems: "center",
        },
        title: {
          fontSize: typography.h3,
          fontWeight: "800",
          color: colors.textPrimary,
          textAlign: "center",
        },
        subtitle: {
          marginTop: spacing.sm,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
        },
        amount: {
          marginTop: spacing.md,
          fontSize: typography.title,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        timer: {
          marginTop: spacing.md,
          fontSize: typography.body,
          fontWeight: "700",
          color: qrExpired ? colors.danger : colors.primary,
        },
        qrWrap: {
          marginVertical: spacing.lg,
          padding: spacing.md,
          backgroundColor: "#fff",
          borderRadius: radii.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        qrImage: { width: sizes.qrImageSize, height: sizes.qrImageSize },
        statusRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        statusText: {
          fontSize: typography.bodySmall,
          color: colors.textMuted,
        },
        error: {
          marginTop: spacing.sm,
          color: colors.danger,
          fontSize: typography.bodySmall,
          textAlign: "center",
        },
        button: {
          marginTop: spacing.lg,
          backgroundColor: colors.primary,
          borderRadius: radii.pill,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xxl,
          minWidth: sizes.buttonMinWidth,
        },
        buttonText: {
          color: colors.onPrimary,
          fontWeight: "700",
          fontSize: typography.button,
          textAlign: "center",
        },
      }),
    [colors, layout.modalMaxWidth, qrExpired, radii, sizes, spacing, typography],
  );

  const statusLabel = t(`payment.result.${status}`, status);
  const hint = qrExpired
    ? t("payment.khqrExpiredHint")
    : isPaid
      ? t("payment.khqrPaidHint")
      : isFailed
        ? t("payment.khqrFailedHint")
        : t("payment.khqrScanHint");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("payment.khqrTitle")}</Text>
          <Text style={styles.subtitle}>{hint}</Text>
          {amountLabel ? <Text style={styles.amount}>{amountLabel}</Text> : null}
          <Text style={styles.timer}>
            {qrExpired
              ? t("payment.khqrExpired")
              : t("payment.khqrExpiresIn", { time: formatCountdown(remainingMs) })}
          </Text>

          <View style={styles.qrWrap}>
            {qrUri && !qrExpired ? (
              <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <View style={[styles.qrImage, { alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: colors.textMuted }}>{t("payment.khqrNoQr")}</Text>
              </View>
            )}
          </View>

          {showStatusRow ? (
            <View style={styles.statusRow}>
              {isPaid ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              <Text style={styles.statusText}>
                {t("payment.khqrChecking", { status: statusLabel })}
              </Text>
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{t("payment.khqrClose")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
