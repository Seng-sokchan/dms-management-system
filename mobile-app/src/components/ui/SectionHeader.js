import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

export default function SectionHeader({ title, subtitle, rightAction }) {
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

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },
});
