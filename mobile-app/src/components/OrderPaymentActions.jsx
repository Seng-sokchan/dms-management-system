import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { PrimaryButton } from "./ui";

export function formatPaymentAmount(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  if (currency === "KHR") return `${Math.round(n).toLocaleString()} KHR`;
  return `${n.toFixed(2)} USD`;
}

/**
 * Pay now action for an order (customer or depot).
 */
export default function OrderPaymentActions({ order, navigation }) {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();

  const paymentStatus = order?.paymentStatus || "unpaid";
  const isPaid = paymentStatus === "paid";
  const canPay = !isPaid;

  const stackNav = navigation?.getParent?.() || navigation;

  const styles = StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
    },
    badgePaid: { backgroundColor: colors.successSoft },
    badgeText: { fontSize: typography.caption, fontWeight: "700", color: colors.textPrimary },
  });

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: canPay ? spacing.sm : 0 }}>
        <View style={[styles.badge, isPaid && styles.badgePaid]}>
          <Text style={styles.badgeText}>{t(`payment.status.${paymentStatus}`, paymentStatus)}</Text>
        </View>
      </View>
      {canPay ? (
        <PrimaryButton
          title={t("payment.payNow")}
          onPress={() => stackNav?.navigate("OrderPayment", { order })}
        />
      ) : null}
    </View>
  );
}
