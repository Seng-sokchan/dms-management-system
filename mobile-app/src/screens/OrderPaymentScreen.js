import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import KhqrPaymentModal from "../components/KhqrPaymentModal";
import { Card, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { createPaymentIntent } from "../services/paymentsApi";
import { setPendingPaymentReturn } from "../services/paymentPendingStorage";
import { openAbaPaywayCheckout } from "../utils/openAbaPayway";

export default function OrderPaymentScreen({ route, navigation }) {
  const order = route.params?.order;
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { colors, sizes, spacing, typography } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [khqrVisible, setKhqrVisible] = useState(false);
  const [khqrSession, setKhqrSession] = useState(null);

  const amountLabel =
    order?.currency === "KHR"
      ? `${Math.round(Number(order?.amountTotal)).toLocaleString()} KHR`
      : `${Number(order?.amountTotal).toFixed(2)} USD`;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        amount: {
          fontSize: typography.title,
          fontWeight: "800",
          color: colors.textPrimary,
          marginTop: spacing.sm,
        },
        note: {
          marginTop: spacing.md,
          color: colors.textMuted,
          fontSize: typography.bodySmall,
          lineHeight: 20,
        },
        outlineButton: {
          marginTop: spacing.md,
          minHeight: sizes.touchTarget,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.lg,
        },
        outlineButtonPressed: { opacity: 0.85 },
        outlineButtonText: {
          color: colors.primary,
          fontSize: typography.button,
          fontWeight: "700",
        },
        outlineButtonDisabled: { opacity: 0.5 },
      }),
    [colors, sizes.touchTarget, spacing, typography],
  );

  const handlePay = async () => {
    if (!token || !order?.id) return;
    setSubmitting(true);
    try {
      const intent = await createPaymentIntent(token, {
        orderId: order.id,
        paymentOption: "abapay_deeplink",
      });

      await setPendingPaymentReturn({
        paymentId: intent.paymentId,
        orderId: order.id,
        role: user?.role || "Customer",
      });

      await openAbaPaywayCheckout(intent, { t });
    } catch (err) {
      Alert.alert(t("payment.intentFailed"), getApiErrorMessage(err, t("payment.intentFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKhqrPay = async () => {
    if (!token || !order?.id) return;
    setSubmitting(true);
    try {
      const intent = await createPaymentIntent(token, {
        orderId: order.id,
        paymentOption: "abapay_khqr",
      });

      if (!intent?.qrString && !intent?.qrImageUrl) {
        Alert.alert(t("payment.intentFailed"), t("payment.khqrNoData"));
        return;
      }

      setKhqrSession({
        paymentId: intent.paymentId,
        qrString: intent.qrString,
        qrImageUrl: intent.qrImageUrl,
      });
      setKhqrVisible(true);
    } catch (err) {
      Alert.alert(t("payment.intentFailed"), getApiErrorMessage(err, t("payment.intentFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKhqrPaid = () => {
    if (!khqrSession?.paymentId) return;
    setKhqrVisible(false);
    navigation.replace("PaymentResult", {
      paymentId: khqrSession.paymentId,
      orderId: order.id,
      fromAbaReturn: false,
    });
    setKhqrSession(null);
  };

  const handleKhqrClose = () => {
    setKhqrVisible(false);
    setKhqrSession(null);
  };

  if (!order) {
    return (
      <Screen>
        <Text>{t("payment.orderMissing")}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader title={t("payment.checkoutTitle")} subtitle={t("payment.checkoutSubtitle")} />
      <Card>
        <Text style={{ color: colors.textMuted }}>{t("payment.orderLabel", { id: order.id })}</Text>
        <Text style={styles.amount}>
          {order.currency === "KHR"
            ? `${Math.round(Number(order.amountTotal)).toLocaleString()} KHR`
            : `${Number(order.amountTotal).toFixed(2)} USD`}
        </Text>
        <Text style={styles.note}>{t("payment.secureNote")}</Text>
      </Card>
      <PrimaryButton
        title={submitting ? t("payment.starting") : t("payment.payWithAba")}
        onPress={handlePay}
        disabled={submitting}
        style={{ marginTop: spacing.lg }}
      />
      <Pressable
        onPress={handleKhqrPay}
        disabled={submitting}
        style={({ pressed }) => [
          styles.outlineButton,
          submitting && styles.outlineButtonDisabled,
          pressed && !submitting && styles.outlineButtonPressed,
        ]}
      >
        <Text style={styles.outlineButtonText}>
          {submitting ? t("payment.starting") : t("payment.payWithKhqr")}
        </Text>
      </Pressable>

      <KhqrPaymentModal
        visible={khqrVisible}
        paymentId={khqrSession?.paymentId}
        qrString={khqrSession?.qrString}
        qrImageUrl={khqrSession?.qrImageUrl}
        amountLabel={amountLabel}
        onClose={handleKhqrClose}
        onPaid={handleKhqrPaid}
      />
    </Screen>
  );
}
