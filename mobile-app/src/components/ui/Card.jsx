import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function Card({ children, style }) {
  const { colors, radii, shadows, spacing } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          ...shadows.card,
        },
      }),
    [colors.surface, colors.border, radii.xl, spacing.lg, shadows.card],
  );

  return <View style={[styles.card, style]}>{children}</View>;
}
