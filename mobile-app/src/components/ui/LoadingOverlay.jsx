import React, { useMemo } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function LoadingOverlay({ visible, message, accessibilityLabel }) {
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const label = accessibilityLabel ?? message ?? t("common.loading");
  const displayMessage = message ?? t("common.loading");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        },
        card: {
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.xl,
          minWidth: 220,
          gap: spacing.md,
        },
        text: {
          fontSize: typography.body,
          fontWeight: "600",
          color: colors.textPrimary,
          textAlign: "center",
        },
      }),
    [colors, radii, spacing, typography],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View
        style={styles.overlay}
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        importantForAccessibility="yes"
      >
        <View style={styles.card}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.text}>{displayMessage}</Text>
        </View>
      </View>
    </Modal>
  );
}
