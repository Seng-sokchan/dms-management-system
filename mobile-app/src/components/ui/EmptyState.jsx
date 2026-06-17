import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import AppIcon from "./AppIcon";

export default function EmptyState({ title, subtitle, message, icon, action }) {
  const { colors, spacing, typography, sizes } = useTheme();
  const body = subtitle || message;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: spacing.xxl,
          paddingHorizontal: spacing.lg,
        },
        iconWrap: {
          width: sizes.iconLg,
          height: sizes.iconLg,
          borderRadius: sizes.iconLg / 2,
          backgroundColor: colors.surfaceSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
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
        action: {
          marginTop: spacing.lg,
          width: "100%",
          maxWidth: 280,
        },
      }),
    [colors, sizes.iconLg, spacing, typography.body, typography.caption],
  );

  return (
    <View style={styles.wrap} accessibilityRole="text">
      {icon ? (
        <View style={styles.iconWrap}>
          <AppIcon name={icon} size={28} color={colors.textMuted} />
        </View>
      ) : null}
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!body && <Text style={styles.subtitle}>{body}</Text>}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}
