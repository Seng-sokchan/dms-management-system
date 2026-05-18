import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "./ui";
import { colors, radii, spacing, typography } from "../theme";

function DeliveryOrderCardInner({
  item,
  mode,
  isActiveNav,
  submittingOrderId,
  onAddToCart,
  onStatusChange,
}) {
  const isSubmitting = submittingOrderId === item.id;

  return (
    <Card style={[styles.orderCard, isActiveNav && styles.orderCardActive]}>
      {isActiveNav ? <Text style={styles.nextStopBadge}>Next stop</Text> : null}
      <Text style={styles.orderTitle}>#{item.id}</Text>
      <Text style={styles.orderLine}>Customer: {item.customerName || "-"}</Text>
      <Text style={styles.orderStatus}>Status: {item.status}</Text>
      <View style={styles.actionsRow}>
        {mode === "pending" ? (
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isSubmitting}
            onPress={() => onAddToCart(item.id)}
          >
            <Text style={styles.actionText}>Add to Cart</Text>
          </TouchableOpacity>
        ) : null}
        {mode === "active" ? (
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isSubmitting}
            onPress={() => onStatusChange(item.id, "Recieve_By_Customer")}
          >
            <Text style={styles.actionText}>Delivered</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Card>
  );
}

export const DeliveryOrderCard = React.memo(DeliveryOrderCardInner);

const styles = StyleSheet.create({
  orderCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "transparent",
  },
  orderCardActive: {
    borderColor: colors.primary,
  },
  nextStopBadge: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    color: colors.onPrimary || "#ffffff",
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
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: colors.onPrimary || "#ffffff",
    fontWeight: "700",
  },
});
