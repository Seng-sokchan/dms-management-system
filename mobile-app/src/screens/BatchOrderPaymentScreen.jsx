import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import KhqrPaymentModal from "../components/KhqrPaymentModal";
import { Card, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { createBatchPaymentIntent } from "../services/paymentsApi";
import { setPendingPaymentReturn } from "../services/paymentPendingStorage";
import { openAbaPaywayCheckout } from "../utils/openAbaPayway";

function formatAmount(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  if (currency === "KHR") return `${Math.round(n).toLocaleString()} KHR`;
  return `${n.toFixed(2)} USD`;
}

export default function BatchOrderPaymentScreen({ route, navigation }) {
  const batchId = route.params?.batchId;
  const orders = useMemo(
    () => (Array.isArray(route.params?.orders) ? route.params.orders : []),
    [route.params?.orders],
  );
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { colors, sizes, spacing, typography } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [khqrVisible, setKhqrVisible] = useState(false);
  const [khqrSession, setKhqrSession] = useState(null);

  const currency = orders[0]?.currency || "KHR";
  const totalAmount = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order?.amountTotal || 0), 0),
    [orders],
  );
  const amountLabel = formatAmount(totalAmount, currency);
  const orderIds = useMemo(() => orders.map((order) => order.id), [orders]);

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
        lineRow: {
          paddingVertical: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        lineTitle: {
          fontSize: typography.bodySmall,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        lineMeta: {
          marginTop: 2,
          fontSize: typography.caption,
          color: colors.textSecondary,
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
        scrollContent: {
          paddingBottom: spacing.xxl,
        },
      }),
    [colors, sizes.touchTarget, spacing, typography],
  );

  const startCheckout = async (paymentOption) => {
    if (!token || !batchId) return null;
    return createBatchPaymentIntent(token, { batchId, paymentOption });
  };

  const handlePay = async () => {
    if (!token || !batchId) return;
    setSubmitting(true);
    try {
      const intent = await startCheckout("abapay_deeplink");

      await setPendingPaymentReturn({
        paymentId: intent.paymentId,
        orderId: orderIds[0] ?? null,
        batchId,
        orderIds,
        role: user?.role || "Depot",
      });

      await openAbaPaywayCheckout(intent, { t });
    } catch (err) {
      Alert.alert(
        t("depot.batchPaymentFailedTitle"),
        getApiErrorMessage(err, t("depot.batchPaymentFailedDefault")),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleKhqrPay = async () => {
    if (!token || !batchId) return;
    setSubmitting(true);
    try {
      const intent = await startCheckout("abapay_khqr");

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
      Alert.alert(
        t("depot.batchPaymentFailedTitle"),
        getApiErrorMessage(err, t("depot.batchPaymentFailedDefault")),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleKhqrPaid = () => {
    if (!khqrSession?.paymentId) return;
    setKhqrVisible(false);
    navigation.replace("PaymentResult", {
      paymentId: khqrSession.paymentId,
      orderId: orderIds[0] ?? null,
      batchId,
      orderIds,
      fromAbaReturn: false,
    });
    setKhqrSession(null);
  };

  const handleKhqrClose = () => {
    setKhqrVisible(false);
    setKhqrSession(null);
  };

  if (!batchId || orders.length === 0) {
    return (
      <Screen>
        <Text>{t("depot.batchPaymentMissing")}</Text>
      </Screen>
    );
  }

  return (
    <Screen busy={submitting} busyMessage={t("payment.starting")}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SectionHeader
          title={t("depot.batchCheckoutTitle")}
          subtitle={t("depot.batchCheckoutSubtitle", { count: orders.length })}
        />
        <Card>
          <Text style={{ color: colors.textMuted }}>
            {t("depot.batchCheckoutLabel", { count: orders.length })}
          </Text>
          <Text style={styles.amount}>{amountLabel}</Text>
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

        <Card style={{ marginTop: spacing.lg }}>
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.lineRow}>
                <Text style={styles.lineTitle}>
                  {t("payment.orderLabel", { id: item.id })}
                </Text>
                <Text style={styles.lineMeta}>
                  {item.customerName || "-"} · {item.itemName || "-"}
                </Text>
                <Text style={styles.lineMeta}>
                  {t("depot.batchOrderQuantity", { qty: Number(item.orderedQty || 0) })}
                </Text>
              </View>
            )}
          />
        </Card>
      </ScrollView>

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
