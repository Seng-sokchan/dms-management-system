import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Card } from "./ui";

function DeliveryOrderCardInner({
  item,
  mode,
  isActiveNav,
  submittingOrderId,
  onAddToCart,
  onStatusChange,
}) {
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const isSubmitting = submittingOrderId === item.id;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        orderCard: {
          marginBottom: spacing.md,
        },
        orderCardActive: {
          borderColor: colors.primary,
          borderWidth: 2,
        },
        nextStopBadge: {
          alignSelf: "flex-start",
          marginBottom: spacing.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radii.pill,
          backgroundColor: colors.primary,
          color: colors.onPrimary,
          fontSize: typography.caption,
          fontWeight: "700",
          overflow: "hidden",
        },
        orderTitle: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        },
        orderLine: {
          fontSize: typography.body,
          color: colors.textSecondary,
          marginBottom: spacing.xs,
        },
        orderStatus: {
          marginTop: spacing.sm,
          fontSize: typography.caption,
          color: colors.textMuted,
        },
        actionsRow: {
          flexDirection: "row",
          gap: spacing.sm,
          marginTop: spacing.md,
        },
        actionButton: {
          backgroundColor: colors.primary,
          borderRadius: radii.pill,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        },
        actionText: {
          color: colors.onPrimary,
          fontWeight: "700",
        },
      }),
    [colors, radii, spacing, typography],
  );

  return (
    <Card style={[styles.orderCard, isActiveNav && styles.orderCardActive]}>
      {isActiveNav ? <Text style={styles.nextStopBadge}>{t("delivery.nextStop")}</Text> : null}
      <Text style={styles.orderTitle}>#{item.id}</Text>
      <Text style={styles.orderLine}>
        {t("delivery.orderCustomer", { name: item.customerName || "-" })}
      </Text>
      <Text style={styles.orderStatus}>
        {t("delivery.orderStatus", { status: item.status })}
      </Text>
      <View style={styles.actionsRow}>
        {mode === "pending" ? (
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isSubmitting}
            onPress={() => onAddToCart(item.id)}
          >
            <Text style={styles.actionText}>{t("delivery.addToCart")}</Text>
          </TouchableOpacity>
        ) : null}
        {mode === "active" ? (
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isSubmitting}
            onPress={() => onStatusChange(item.id, "Recieve_By_Customer")}
          >
            <Text style={styles.actionText}>{t("delivery.delivered")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Card>
  );
}

export const DeliveryOrderCard = React.memo(DeliveryOrderCardInner);
