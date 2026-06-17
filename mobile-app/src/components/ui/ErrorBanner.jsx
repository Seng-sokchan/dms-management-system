import React, { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import AppIcon from "./AppIcon";
import Card from "./Card";
import PrimaryButton from "./PrimaryButton";

export default function ErrorBanner({ title, message, onRetry, retryLabel }) {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: spacing.md,
          backgroundColor: colors.dangerSoft,
        },
        title: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: typography.body,
        },
        body: {
          color: colors.textSecondary,
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
          lineHeight: 20,
        },
        retryButton: {
          marginTop: spacing.md,
          alignSelf: "flex-start",
        },
      }),
    [colors, spacing, typography],
  );

  return (
    <Card style={styles.card} accessibilityRole="alert">
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.body}>{message}</Text>}
      {onRetry ? (
        <PrimaryButton
          title={retryLabel || t("common.tryAgain")}
          onPress={onRetry}
          style={styles.retryButton}
          icon={<AppIcon name="refresh" size={18} color={colors.onPrimary} />}
        />
      ) : null}
    </Card>
  );
}
