import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "./ui";
import { useTheme } from "../context/ThemeContext";

function ProgressRow({ label, value, loading, styles }) {
  return (
    <Text style={styles.row} numberOfLines={2}>
      <Text style={styles.label}>{label}: </Text>
      <Text style={[styles.value, loading && styles.valueLoading]}>{value}</Text>
    </Text>
  );
}

function DeliveryProgressCardInner({ title, rows }) {
  const { colors, spacing, typography } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: { marginBottom: spacing.md, paddingVertical: spacing.md },
        title: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: typography.body,
          marginBottom: spacing.md,
        },
        row: {
          marginBottom: spacing.sm,
          fontSize: typography.bodySmall,
          lineHeight: 20,
        },
        label: {
          color: colors.textMuted,
          fontWeight: "600",
        },
        value: {
          color: colors.textPrimary,
        },
        valueLoading: { color: colors.textSecondary },
      }),
    [colors, spacing, typography],
  );

  if (!rows?.length) return null;

  return (
    <Card style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {rows.map((row) => (
        <ProgressRow
          key={row.label}
          label={row.label}
          value={row.value}
          loading={row.loading}
          styles={styles}
        />
      ))}
    </Card>
  );
}

export default React.memo(DeliveryProgressCardInner);
