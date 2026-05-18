import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function SectionHeader({ title, subtitle, rightAction }) {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.md,
          marginTop: spacing.sm,
        },
        content: {
          flex: 1,
          marginRight: spacing.md,
        },
        title: {
          fontSize: typography.h2,
          fontWeight: "800",
          color: colors.textPrimary,
          letterSpacing: -0.3,
        },
        subtitle: {
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
          lineHeight: 18,
        },
      }),
    [colors, spacing, typography],
  );

  return (
    <View style={styles.row}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction}
    </View>
  );
}
