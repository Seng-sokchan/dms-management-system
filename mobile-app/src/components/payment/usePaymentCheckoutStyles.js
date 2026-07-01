import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export function usePaymentCheckoutStyles() {
  const { colors, radii, spacing, typography, borders } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          paddingBottom: spacing.xxl,
        },
        title: {
          fontSize: typography.h3,
          fontWeight: "800",
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        orderSummarySubtitle: {
          marginBottom: spacing.sm,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
        },
        panel: {
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          ...borders.panel,
        },
        orderSummaryCard: {
          marginBottom: spacing.lg,
          padding: spacing.lg,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          ...borders.panel,
        },
        amountCard: {
          marginBottom: spacing.lg,
          padding: spacing.lg,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          ...borders.panel,
        },
        list: {
          borderRadius: radii.lg,
          overflow: "hidden",
          ...borders.panel,
        },
        amountLabel: {
          fontSize: typography.caption,
          color: colors.textMuted,
        },
        amountValue: {
          marginTop: spacing.xs,
          fontSize: typography.title,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        lineRow: {
          paddingVertical: spacing.sm,
          ...borders.dividerBottom,
        },
        lineRowLast: {
          borderBottomWidth: 0,
        },
        lineTitle: {
          fontSize: typography.bodySmall,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        lineMeta: {
          marginTop: 2,
          fontSize: typography.caption,
          color: colors.textSecondary,
        },
      }),
    [borders, colors, radii, spacing, typography],
  );
}
