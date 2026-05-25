import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton } from "./ui";
import { getOrderPayment } from "../services/paymentsApi";

export function formatPaymentAmount(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  if (currency === "KHR") return `${Math.round(n).toLocaleString()} KHR`;
  return `${n.toFixed(2)} USD`;
}

/**
 * Pay now / view pending actions for an order (customer or depot).
 */
export default function OrderPaymentActions({ order, navigation, token: tokenProp }) {
  const { token: authToken } = useAuth();
  const token = tokenProp || authToken;
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();

  const paymentStatus = order?.paymentStatus || "unpaid";
  const isPaid = paymentStatus === "paid";
  const canPay = !isPaid && paymentStatus !== "pending";

  const stackNav = navigation?.getParent?.() || navigation;

  const styles = StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
    },
    badgePaid: { backgroundColor: colors.successSoft || "#e8f5e9" },
    badgeText: { fontSize: typography.caption, fontWeight: "700", color: colors.textPrimary },
    link: { color: colors.primary, fontWeight: "600", marginTop: spacing.sm },
  });

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: canPay || paymentStatus === "pending" ? spacing.sm : 0 }}>
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
      {paymentStatus === "pending" ? (
        <Pressable
          onPress={async () => {
            let paymentId = null;
            try {
              const data = await getOrderPayment(token, order.id);
              paymentId = data?.payment?.paymentId || null;
            } catch {
              paymentId = null;
            }
            stackNav?.navigate("PaymentResult", { paymentId, orderId: order.id });
          }}
        >
          <Text style={styles.link}>{t("payment.viewPending")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
