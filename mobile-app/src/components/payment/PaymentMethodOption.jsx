import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../context/ThemeContext";

export default function PaymentMethodOption({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
  badge,
}) {
  const { colors, radii, spacing, typography, borders } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
          ...borders.dividerBottom,
        },
        rowPressed: {
          backgroundColor: colors.surfaceSoft,
        },
        rowDisabled: {
          opacity: 0.55,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: radii.md,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        },
        body: {
          flex: 1,
          paddingRight: spacing.sm,
        },
        title: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        subtitle: {
          marginTop: 4,
          fontSize: typography.caption,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        badge: {
          alignSelf: "flex-start",
          marginTop: 6,
          fontSize: typography.caption,
          fontWeight: "600",
          color: colors.textMuted,
        },
      }),
    [borders.dividerBottom, colors, radii, spacing, typography],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textMuted}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}
