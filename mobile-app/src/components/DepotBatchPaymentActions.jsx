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

  if (allPaid) {
    return { badge: "paid", canPay: false, mixed: false };
  }
  if (allUnpaid) {
    return { badge: "unpaid", canPay: true, mixed: false };
  }
  return { badge: "mixed", canPay: false, mixed: true };
}

export default function DepotBatchPaymentActions({
  masterOrderId,
  orders,
  navigation,
  i18nPrefix = "depot",
}) {
  const { t } = useTranslation();
  const { colors, spacing, typography, borders } = useTheme();
  const stackNav = navigation?.getParent?.() || navigation;

  const paymentState = useMemo(() => resolveBatchPaymentState(orders), [orders]);
  const isPaid = paymentState.badge === "paid";

  const styles = StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
      ...borders.panel,
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
      ? t(`${i18nPrefix}.batchPaymentMixed`)
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
        <Text style={styles.hint}>{t(`${i18nPrefix}.batchPaymentMixedHint`)}</Text>
      ) : null}
      {paymentState.canPay ? (
        <PrimaryButton
          title={t(`${i18nPrefix}.payBatch`)}
          onPress={() =>
            stackNav?.navigate("BatchOrderPayment", {
              masterOrderId,
              orders,
            })
          }
        />
      ) : null}
    </View>
  );
}
