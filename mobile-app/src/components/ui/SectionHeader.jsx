import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function SectionHeader({ title, subtitle, leftAction, rightAction }) {
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
        side: {
          flexShrink: 0,
        },
        content: {
          flex: 1,
          marginHorizontal: spacing.sm,
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
      {leftAction ? <View style={styles.side}>{leftAction}</View> : null}
      <View style={[styles.content, !leftAction && { marginLeft: 0 }, !rightAction && { marginRight: 0 }]}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction ? <View style={styles.side}>{rightAction}</View> : null}
    </View>
  );
}
