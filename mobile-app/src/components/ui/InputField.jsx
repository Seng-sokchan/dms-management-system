import React, { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function InputField({
  label,
  error,
  style,
  accessibilityLabel,
  rightAccessory,
  ...inputProps
}) {
  const { colors, radii, spacing, typography, borders } = useTheme();
  const fieldLabel = accessibilityLabel || label;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          marginBottom: spacing.sm,
          color: colors.textPrimary,
          fontSize: typography.bodySmall,
          fontWeight: "600",
        },
        inputRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        input: {
          flex: 1,
          backgroundColor: colors.surfaceSoft,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: typography.body,
          color: colors.textPrimary,
          ...borders.panel,
        },
        inputWithAccessory: {
          paddingRight: spacing.sm,
        },
        accessory: {
          position: "absolute",
          right: spacing.sm,
        },
        inputError: {
          borderColor: colors.danger,
        },
        error: {
          marginTop: spacing.xs,
          color: colors.danger,
          fontSize: typography.bodySmall,
        },
      }),
    [borders.panel, colors, radii, spacing, typography],
  );

  return (
    <View style={style}>
      {!!label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      )}
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, rightAccessory && styles.inputWithAccessory, error && styles.inputError]}
          accessibilityLabel={fieldLabel}
          accessibilityHint={error || undefined}
          {...inputProps}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}
