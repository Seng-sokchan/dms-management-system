import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton } from "./ui";
import { getOrderPayment } from "../services/paymentsApi";

function resolveBatchPaymentState(orders) {
  const statuses = (orders || []).map((order) => order?.paymentStatus || "unpaid");
  if (!statuses.length) {
    return { badge: "unpaid", canPay: false, showPending: false, mixed: false };
  }
  const allPaid = statuses.every((status) => status === "paid");
  const allUnpaid = statuses.every((status) => status === "unpaid");
  const allPending = statuses.every((status) => status === "pending");

  if (allPaid) {
    return { badge: "paid", canPay: false, showPending: false, mixed: false };
  }
  if (allPending) {
    return { badge: "pending", canPay: false, showPending: true, mixed: false };
  }
  if (allUnpaid) {
    return { badge: "unpaid", canPay: true, showPending: false, mixed: false };
  }
  return { badge: "mixed", canPay: false, showPending: false, mixed: true };
}

export default function DepotBatchPaymentActions({ batchId, orders, navigation, token: tokenProp }) {
  const { token: authToken } = useAuth();
  const token = tokenProp || authToken;
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const stackNav = navigation?.getParent?.() || navigation;

  const paymentState = useMemo(() => resolveBatchPaymentState(orders), [orders]);
  const isPaid = paymentState.badge === "paid";

  const styles = StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
    },
    badgePaid: { backgroundColor: colors.successSoft || "#e8f5e9" },
    badgeText: { fontSize: typography.caption, fontWeight: "700", color: colors.textPrimary },
    hint: {
      marginTop: spacing.xs,
      fontSize: typography.caption,
      color: colors.textMuted,
    },
    link: { color: colors.primary, fontWeight: "600", marginTop: spacing.sm },
  });

  const badgeLabel =
    paymentState.badge === "mixed"
      ? t("depot.batchPaymentMixed")
      : t(`payment.status.${paymentState.badge}`, paymentState.badge);

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginBottom:
            paymentState.canPay || paymentState.showPending || paymentState.mixed ? spacing.sm : 0,
        }}
      >
        <View style={[styles.badge, isPaid && styles.badgePaid]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>
      {paymentState.mixed ? (
        <Text style={styles.hint}>{t("depot.batchPaymentMixedHint")}</Text>
      ) : null}
      {paymentState.canPay ? (
        <PrimaryButton
          title={t("depot.payBatch")}
          onPress={() =>
            stackNav?.navigate("BatchOrderPayment", {
              batchId,
              orders,
            })
          }
        />
      ) : null}
      {paymentState.showPending ? (
        <Pressable
          onPress={async () => {
            const firstOrder = orders?.[0];
            if (!firstOrder?.id) return;
            let paymentId = null;
            try {
              const data = await getOrderPayment(token, firstOrder.id);
              paymentId = data?.payment?.paymentId || null;
            } catch {
              paymentId = null;
            }
            stackNav?.navigate("PaymentResult", {
              paymentId,
              orderId: firstOrder.id,
              batchId,
              orderIds: orders.map((order) => order.id),
            });
          }}
        >
          <Text style={styles.link}>{t("payment.viewPending")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
