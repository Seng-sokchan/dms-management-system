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
}) {
  const { colors, radii, spacing, typography } = useTheme();
  const isDisabled = disabled || loading;
  const backgroundColor = tone === "success" ? colors.success : colors.primary;
  const pressedColor = tone === "success" ? colors.successPressed : colors.primaryPressed;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: 44,
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
          color: colors.onPrimary,
          fontSize: typography.button,
          fontWeight: "700",
        },
        disabled: {
          opacity: 0.65,
        },
      }),
    [colors.onPrimary, radii.pill, spacing, typography.button],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? pressedColor : backgroundColor },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
