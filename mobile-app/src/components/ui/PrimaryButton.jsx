import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
  textStyle,
  tone = "primary",
  icon,
  accessibilityLabel,
  testID,
}) {
  const { colors, radii, sizes, spacing, typography, borders } = useTheme();
  const isDisabled = disabled || loading;
  const backgroundColor =
    tone === "success" ? colors.success : tone === "soft" ? colors.surfaceSoft : colors.primary;
  const pressedColor =
    tone === "success"
      ? colors.successPressed
      : tone === "soft"
        ? colors.surfaceMuted
        : colors.primaryPressed;
  const labelColor = tone === "soft" ? colors.textPrimary : colors.onPrimary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: sizes.touchTarget,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
        },
        contentRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
        },
        iconSlot: {
          justifyContent: "center",
          alignItems: "center",
        },
        text: {
          color: labelColor,
          fontSize: typography.button,
          fontWeight: "700",
        },
        disabled: {
          opacity: 0.65,
        },
      }),
    [labelColor, radii.pill, sizes.touchTarget, spacing, typography.button],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? pressedColor : backgroundColor },
        tone === "soft" && borders.panel,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
