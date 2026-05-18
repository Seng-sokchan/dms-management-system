import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, PrimaryButton } from "./ui";
import { colors, radii, spacing, typography } from "../theme";

function DeliveryCartCardInner({
  orders,
  totalPendingCount,
  canStartDelivery,
  submitting,
  onStartDelivery,
  onRemoveFromCart,
}) {
  const cartCount = orders.length;

  return (
    <Card style={styles.cartCard}>
      <Text style={styles.cartTitle}>Delivery cart</Text>
      <Text style={styles.cartSubtitle}>
        {canStartDelivery
          ? `${cartCount} order${cartCount === 1 ? "" : "s"} ready to start`
          : `${cartCount} of ${totalPendingCount} order${totalPendingCount === 1 ? "" : "s"} in cart — add all to start delivery`}
      </Text>

      <View style={styles.linesWrap}>
        {orders.map((order) => (
          <View key={String(order.id)} style={styles.lineRow}>
            <View style={styles.lineInfo}>
              <Text style={styles.lineTitle}>#{order.id}</Text>
              <Text style={styles.lineMeta}>Customer: {order.customerName || "-"}</Text>
            </View>
            <Pressable
              style={styles.removeBtn}
              onPress={() => onRemoveFromCart(order.id)}
              disabled={submitting}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <PrimaryButton
        title="Start Delivery"
        onPress={onStartDelivery}
        loading={submitting}
        disabled={!canStartDelivery || submitting}
        style={styles.startButton}
      />
    </Card>
  );
}

export const DeliveryCartCard = React.memo(DeliveryCartCardInner);

const styles = StyleSheet.create({
  cartCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cartTitle: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cartSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  linesWrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineInfo: {
    flex: 1,
  },
  lineTitle: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  lineMeta: {
    marginTop: 2,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  removeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  removeBtnText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.danger || "#dc2626",
  },
  startButton: {
    marginTop: spacing.md,
  },
});
