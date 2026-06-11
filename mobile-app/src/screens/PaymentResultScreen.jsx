import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Card, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { getOrderPayment } from "../services/paymentsApi";
import { clearPendingPaymentReturn } from "../services/paymentPendingStorage";

function formatPaidAmount(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  if (String(currency).toUpperCase() === "KHR") {
    return `${Math.round(n).toLocaleString()} KHR`;
  }
  return `${n.toFixed(2)} USD`;
}

function StatusBadge({ tone, label, colors, styles }) {
  const bg =
    tone === "success"
      ? "rgba(22, 163, 74, 0.12)"
      : tone === "danger"
        ? "rgba(220, 38, 38, 0.12)"
        : colors.surfaceMuted;
  const fg = tone === "success" ? colors.success : tone === "danger" ? colors.danger : colors.textPrimary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {tone === "success" ? (
        <View style={[styles.checkCircle, { borderColor: colors.success }]}>
          <Text style={[styles.checkMark, { color: colors.success }]}>✓</Text>
        </View>
      ) : null}
      <Text style={[styles.badgeLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

export default function PaymentResultScreen({ route, navigation }) {
  const paymentIdParam = route.params?.paymentId;
  const orderIdParam = route.params?.orderId;
  const batchIdParam = route.params?.batchId;
  const orderIdsParam = Array.isArray(route.params?.orderIds) ? route.params.orderIds : null;
  const fromAbaReturn = Boolean(
    route.params?.fromAbaReturn || route.params?.fromAba === "1" || route.params?.fromAba === 1,
  );
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { colors, sizes, spacing, typography, radii } = useTheme();
  const [resolvedPaymentId, setResolvedPaymentId] = React.useState(paymentIdParam || null);

  useEffect(() => {
    if (resolvedPaymentId || !token || !orderIdParam) return;
    void getOrderPayment(token, orderIdParam).then((data) => {
      if (data?.payment?.paymentId) {
        setResolvedPaymentId(data.payment.paymentId);
      }
    });
  }, [orderIdParam, resolvedPaymentId, token]);

  const { status, payment, loading, error } = usePaymentStatus(resolvedPaymentId, {
    autoRefresh: true,
  });

  const statusKey = status || "pending";
  const isPaid = statusKey === "paid";
  const isFailed = statusKey === "failed" || statusKey === "expired" || statusKey === "cancelled";
  const isTerminal = isPaid || isFailed;

  useEffect(() => {
    if (isTerminal) void clearPendingPaymentReturn();
  }, [isTerminal]);

  useLayoutEffect(() => {
    let title = t("payment.resultTitle");
    if (isPaid) title = t("payment.completedTitle");
    else if (fromAbaReturn && !isTerminal) title = t("payment.confirmingTitle");
    navigation.setOptions({ title });
  }, [fromAbaReturn, isPaid, isTerminal, navigation, t]);

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
        meta: {
          marginTop: spacing.xs,
          color: colors.textMuted,
          fontSize: typography.bodySmall,
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
        pendingPulse: {
          marginTop: spacing.md,
          padding: spacing.md,
          borderRadius: radii.md,
          backgroundColor: colors.surfaceMuted,
        },
      }),
    [colors, radii, sizes, spacing, typography],
  );

  const statusLabel = t(`payment.result.${statusKey}`, statusKey);
  const hint = isPaid
    ? batchIdParam || (orderIdsParam && orderIdsParam.length > 1)
      ? t("depot.batchPaymentCompletedHint", {
          count: orderIdsParam?.length || payment?.orderIds?.length || 0,
        })
      : t("payment.completedHint")
    : fromAbaReturn && !isTerminal
      ? t("payment.confirmingAfterAba")
      : isTerminal
        ? t("payment.resultTerminalHint")
        : t("payment.resultPendingHint");

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

  return (
    <Screen busy={loading && !payment} busyMessage={t("payment.loading")}>
      <SectionHeader
        title={isPaid ? t("payment.completedTitle") : t("payment.resultTitle")}
        subtitle={isPaid ? t("payment.completedSubtitle") : undefined}
      />
      <Card>
        {loading && !payment ? (
          <View style={styles.hero}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.hint, { marginTop: spacing.md }]}>
              {fromAbaReturn ? t("payment.confirmingAfterAba") : t("payment.resultPendingHint")}
            </Text>
          </View>
        ) : (
          <>
            <StatusBadge
              tone={isPaid ? "success" : isFailed ? "danger" : "neutral"}
              label={statusLabel}
              colors={colors}
              styles={styles}
            />
            {isPaid && payment?.amount != null ? (
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
            {isPaid && payment?.paidAt ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("payment.paidAtLabel")}</Text>
                <Text style={styles.detailValue}>
                  {new Date(payment.paidAt).toLocaleString()}
                </Text>
              </View>
            ) : null}
            {fromAbaReturn && !isTerminal && !loading ? (
              <View style={styles.pendingPulse}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.hint, { marginTop: spacing.sm, textAlign: "center" }]}>
                  {t("payment.confirmingAfterAba")}
                </Text>
              </View>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        )}
      </Card>
      {isTerminal ? (
        <PrimaryButton
          title={t("payment.backToOrders")}
          onPress={goBackToOrders}
          tone={isPaid ? "success" : undefined}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}
    </Screen>
  );
}
