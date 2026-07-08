import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { formatPaymentAmountParts } from "../../utils/formatPaymentAmount";

const CURRENCY_OPTIONS = ["KHR", "USD"];

function CurrencySegment({ label, selected, onPress, isFirst, isLast, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        isFirst && styles.segmentFirst,
        isLast && styles.segmentLast,
        selected && styles.segmentActive,
        pressed && !selected && styles.segmentPressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function PaymentAmountCard({
  label,
  amount,
  currency,
  onCurrencyChange,
  loading = false,
}) {
  const { t } = useTranslation();
  const { colors, spacing, typography, radii, borders } = useTheme();

  const amountParts = useMemo(
    () => formatPaymentAmountParts(amount, currency),
    [amount, currency],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: spacing.lg,
          padding: spacing.lg,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          ...borders.panel,
        },
        sectionLabel: {
          fontSize: typography.caption,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: spacing.md,
        },
        currencyLabel: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        },
        currencyHintBox: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing.sm,
          marginBottom: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          backgroundColor: colors.warningSoft,
          borderWidth: 1,
          borderColor: colors.border,
        },
        currencyHintIcon: {
          marginTop: 1,
        },
        currencyHint: {
          flex: 1,
          fontSize: typography.bodySmall,
          fontWeight: "600",
          color: colors.textPrimary,
          lineHeight: 20,
        },
        segmentTrack: {
          flexDirection: "row",
          padding: 4,
          borderRadius: radii.md,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
        },
        segment: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: spacing.sm,
          borderRadius: radii.sm,
        },
        segmentFirst: {},
        segmentLast: {},
        segmentActive: {
          backgroundColor: colors.primary,
        },
        segmentPressed: {
          opacity: 0.75,
        },
        segmentText: {
          fontSize: typography.bodySmall,
          fontWeight: "600",
          color: colors.textMuted,
        },
        segmentTextActive: {
          color: colors.onPrimary,
          fontWeight: "700",
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginVertical: spacing.lg,
        },
        amountBlock: {
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
          minHeight: 56,
          gap: spacing.sm,
        },
        amountValue: {
          fontSize: typography.h1,
          fontWeight: "800",
          color: colors.textPrimary,
          letterSpacing: -0.5,
        },
        amountUnit: {
          fontSize: typography.body,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        amountPlaceholder: {
          fontSize: typography.body,
          color: colors.textMuted,
          textAlign: "center",
        },
      }),
    [borders, colors, radii, spacing, typography],
  );

  const showAmount = !loading && amount != null && amountParts.value !== "—";
  const placeholderText = loading
    ? t("payment.loadingAmount")
    : t("payment.amountUnavailable");

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>{label}</Text>

      <Text style={styles.currencyLabel}>{t("payment.currencyLabel")}</Text>

      <View style={styles.currencyHintBox} accessibilityRole="text">
        <MaterialCommunityIcons
          name="information-outline"
          size={20}
          color={colors.textPrimary}
          style={styles.currencyHintIcon}
        />
        <Text style={styles.currencyHint}>{t("payment.currencySelectHint")}</Text>
      </View>

      <View style={styles.segmentTrack} accessibilityRole="radiogroup">
        {CURRENCY_OPTIONS.map((option, index) => (
          <CurrencySegment
            key={option}
            label={option}
            selected={currency === option}
            onPress={() => onCurrencyChange?.(option)}
            isFirst={index === 0}
            isLast={index === CURRENCY_OPTIONS.length - 1}
            styles={styles}
          />
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.amountBlock}>
        {loading ? (
          <>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.amountPlaceholder}>{placeholderText}</Text>
          </>
        ) : showAmount ? (
          <>
            <Text style={styles.amountValue}>{amountParts.value}</Text>
            <Text style={styles.amountUnit}>{amountParts.unit}</Text>
          </>
        ) : (
          <Text style={styles.amountPlaceholder}>{placeholderText}</Text>
        )}
      </View>
    </View>
  );
}
