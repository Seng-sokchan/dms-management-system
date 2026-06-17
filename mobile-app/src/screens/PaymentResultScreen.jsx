import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Card, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { clearPendingPaymentReturn } from "../services/paymentPendingStorage";

function formatPaidAmount(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  if (String(currency).toUpperCase() === "KHR") {
    return `${Math.round(n).toLocaleString()} KHR`;
  }
  return `${n.toFixed(2)} USD`;
}

function StatusBadge({ label, colors, styles }) {
  return (
    <View style={[styles.badge, { backgroundColor: "rgba(22, 163, 74, 0.12)" }]}>
      <View style={[styles.checkCircle, { borderColor: colors.success }]}>
        <Text style={[styles.checkMark, { color: colors.success }]}>✓</Text>
      </View>
      <Text style={[styles.badgeLabel, { color: colors.success }]}>{label}</Text>
    </View>
  );
}

export default function PaymentResultScreen({ route, navigation }) {
  const paymentIdParam = route.params?.paymentId;
  const orderIdParam = route.params?.orderId;
  const batchIdParam = route.params?.batchId;
  const orderIdsParam = Array.isArray(route.params?.orderIds) ? route.params.orderIds : null;
  const { user } = useAuth();
  const { t } = useTranslation();
  const { colors, sizes, spacing, typography } = useTheme();

  const { status, payment, loading, error } = usePaymentStatus(paymentIdParam, {
    autoRefresh: true,
  });

  const isPaid = status === "paid";

  useEffect(() => {
    if (loading || !paymentIdParam) return;
    if (isPaid) {
      void clearPendingPaymentReturn();
      return;
    }
    if (batchIdParam) {
      navigation.replace("BatchOrderPayment", {
        batchId: batchIdParam,
        orders: orderIdsParam?.map((id) => ({ id })) || [],
      });
      return;
    }
    if (orderIdParam) {
      navigation.replace("OrderPayment", { order: { id: orderIdParam } });
      return;
    }
    navigation.goBack();
  }, [batchIdParam, isPaid, loading, navigation, orderIdParam, orderIdsParam, paymentIdParam]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isPaid ? t("payment.completedTitle") : t("payment.loading"),
    });
  }, [isPaid, navigation, t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          alignItems: "center",
          paddingVertical: spacing.lg,
        },
        badge: {
          alignItems: "center",
          paddingVertical: spacing.md,
        },
        checkCircle: {
          width: sizes.iconLg,
          height: sizes.iconLg,
          borderRadius: sizes.iconLg / 2,
          borderWidth: 2,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
        },
        checkMark: {
          fontSize: sizes.successIconText,
          fontWeight: "800",
        },
        badgeLabel: {
          fontSize: typography.title,
          fontWeight: "800",
          textAlign: "center",
        },
        amount: {
          marginTop: spacing.sm,
          fontSize: typography.title,
          fontWeight: "700",
          color: colors.textPrimary,
          textAlign: "center",
        },
        hint: {
          marginTop: spacing.sm,
          color: colors.textMuted,
          fontSize: typography.bodySmall,
          lineHeight: 20,
        },
        error: { color: colors.danger, marginTop: spacing.sm },
        detailRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        detailLabel: { color: colors.textMuted, fontSize: typography.bodySmall },
        detailValue: {
          color: colors.textPrimary,
          fontSize: typography.bodySmall,
          fontWeight: "600",
        },
      }),
    [colors, sizes, spacing, typography],
  );

  const statusLabel = t("payment.result.paid");
  const hint =
    batchIdParam || (orderIdsParam && orderIdsParam.length > 1)
      ? t("depot.batchPaymentCompletedHint", {
          count: orderIdsParam?.length || payment?.orderIds?.length || 0,
        })
      : t("payment.completedHint");

  const goBackToOrders = () => {
    if (user?.role === "Depot") {
      navigation.navigate("Tabs", {
        screen: "DepotOrdersTab",
        params: { screen: "DepotOrders" },
      });
      return;
    }
    navigation.navigate("Tabs", { screen: "MyOrders" });
  };

  if (!isPaid) {
    return (
      <Screen busy busyMessage={t("payment.loading")}>
        <View style={styles.hero}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen busy={loading && !payment} busyMessage={t("payment.loading")}>
      <SectionHeader
        title={t("payment.completedTitle")}
        subtitle={t("payment.completedSubtitle")}
      />
      <Card>
        <StatusBadge label={statusLabel} colors={colors} styles={styles} />
        {payment?.amount != null ? (
          <Text style={styles.amount}>
            {formatPaidAmount(payment.amount, payment.currency)}
          </Text>
        ) : null}
        <Text style={styles.hint}>{hint}</Text>
        {payment?.orderId && !(batchIdParam || (orderIdsParam && orderIdsParam.length > 1)) ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("payment.orderNumberLabel")}</Text>
            <Text style={styles.detailValue}>#{payment.orderId}</Text>
          </View>
        ) : null}
        {batchIdParam || (orderIdsParam && orderIdsParam.length > 1) || (payment?.orderIds?.length > 1) ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("depot.batchGroupTitle")}</Text>
            <Text style={styles.detailValue}>
              {t(
                (orderIdsParam?.length || payment?.orderIds?.length || 0) === 1
                  ? "depot.batchGroupCount"
                  : "depot.batchGroupCount_plural",
                { count: orderIdsParam?.length || payment?.orderIds?.length || 0 },
              )}
            </Text>
          </View>
        ) : null}
        {payment?.paidAt ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("payment.paidAtLabel")}</Text>
            <Text style={styles.detailValue}>
              {new Date(payment.paidAt).toLocaleString()}
            </Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
      <PrimaryButton
        title={t("payment.backToOrders")}
        onPress={goBackToOrders}
        tone="success"
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}
