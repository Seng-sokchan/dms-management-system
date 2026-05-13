import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

export default function InputField({ label, error, style, ...inputProps }) {
  return (
    <View style={style}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, error && styles.inputError]}
        {...inputProps}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.bodySmall,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: typography.bodySmall,
  },
});
