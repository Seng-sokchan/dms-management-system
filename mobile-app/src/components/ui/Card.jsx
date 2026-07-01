import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function Card({ children, style }) {
  const { colors, radii, shadows, spacing, borders } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          padding: spacing.lg,
          ...borders.panel,
          ...shadows.card,
        },
      }),
    [borders.panel, colors.surface, radii.xl, shadows.card, spacing.lg],
  );

  return <View style={[styles.card, style]}>{children}</View>;
}
