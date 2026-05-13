import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

export default function PrimaryButton({ title, onPress, loading, disabled, style, textStyle, tone = "primary", icon }) {
  const isDisabled = disabled || loading;
  const backgroundColor = tone === "success" ? colors.success : colors.primary;
  const pressedColor = tone === "success" ? colors.successPressed : colors.primaryPressed;

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
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    borderRadius: radii.md,
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
    color: "#fff",
    fontSize: typography.button,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.65,
  },
});
