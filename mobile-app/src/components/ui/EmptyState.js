import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function EmptyState({ title, subtitle }) {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: spacing.xxl,
          paddingHorizontal: spacing.lg,
        },
        title: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: typography.body,
          textAlign: "center",
        },
        subtitle: {
          marginTop: spacing.sm,
          color: colors.textMuted,
          fontSize: typography.caption,
          textAlign: "center",
          lineHeight: 18,
        },
      }),
    [colors, spacing, typography],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}
