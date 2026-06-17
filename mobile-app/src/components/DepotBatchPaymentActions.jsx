import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { PrimaryButton } from "./ui";

function resolveBatchPaymentState(orders) {
  const statuses = (orders || []).map((order) => order?.paymentStatus || "unpaid");
  if (!statuses.length) {
    return { badge: "unpaid", canPay: false, mixed: false };
  }
  const allPaid = statuses.every((status) => status === "paid");
  const allUnpaid = statuses.every((status) => status === "unpaid");
  const allPending = statuses.every((status) => status === "pending");

  if (allPaid) {
    return { badge: "paid", canPay: false, mixed: false };
  }
  if (allPending || allUnpaid) {
    return { badge: allPending ? "pending" : "unpaid", canPay: true, mixed: false };
  }
  return { badge: "mixed", canPay: false, mixed: true };
}

export default function DepotBatchPaymentActions({ batchId, orders, navigation }) {
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
    badgePaid: { backgroundColor: colors.successSoft },
    badgeText: { fontSize: typography.caption, fontWeight: "700", color: colors.textPrimary },
    hint: {
      marginTop: spacing.xs,
      fontSize: typography.caption,
      color: colors.textMuted,
    },
  });

  const badgeLabel =
    paymentState.badge === "mixed"
      ? t("depot.batchPaymentMixed")
      : t(`payment.status.${paymentState.badge}`, paymentState.badge);

  const showActionsBelowBadge = paymentState.canPay || paymentState.mixed;

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginBottom: showActionsBelowBadge ? spacing.sm : 0,
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
    </View>
  );
}
