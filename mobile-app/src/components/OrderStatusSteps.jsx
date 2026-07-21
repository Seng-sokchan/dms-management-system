import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { formatOrderStatusShort } from "../utils/formatOrderStatus";

export const ORDER_STATUS_STEPS = [
  "Owner_Preparing",
  "Sent_To_Factory",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

function stepIndex(status) {
  const idx = ORDER_STATUS_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function OrderStatusStepsInner({ status }) {
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const currentIdx = stepIndex(status);
  const lastIdx = ORDER_STATUS_STEPS.length - 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginBottom: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
        },
        title: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: typography.body,
          marginBottom: spacing.md,
        },
        trackRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        trackSegment: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
        },
        line: {
          flex: 1,
          height: 2,
          backgroundColor: colors.border,
        },
        lineHidden: {
          opacity: 0,
        },
        lineDone: {
          backgroundColor: colors.primary,
        },
        dot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.border,
          marginHorizontal: 2,
        },
        dotDone: {
          backgroundColor: colors.primary,
        },
        dotCurrent: {
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: colors.primary,
          borderWidth: 3,
          borderColor: colors.surfaceSoft,
          marginHorizontal: 0,
        },
        labelsRow: {
          flexDirection: "row",
          marginTop: spacing.sm,
        },
        labelCell: {
          flex: 1,
          minHeight: 34,
          paddingHorizontal: 1,
          justifyContent: "flex-start",
        },
        label: {
          textAlign: "center",
          fontSize: typography.caption,
          lineHeight: 17,
          color: colors.textMuted,
        },
        labelActive: {
          color: colors.textPrimary,
          fontWeight: "700",
        },
        labelDone: {
          color: colors.textSecondary,
          fontWeight: "600",
        },
      }),
    [colors, radii, spacing, typography],
  );

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.title}>{t("tracking.statusSteps.title")}</Text>
      <View style={styles.trackRow}>
        {ORDER_STATUS_STEPS.map((step, index) => {
          const done = index < currentIdx;
          const current = index === currentIdx;
          return (
            <View key={step} style={styles.trackSegment}>
              <View
                style={[
                  styles.line,
                  index === 0 && styles.lineHidden,
                  (done || current) && index > 0 && styles.lineDone,
                ]}
              />
              <View style={[styles.dot, done && styles.dotDone, current && styles.dotCurrent]} />
              <View
                style={[
                  styles.line,
                  index === lastIdx && styles.lineHidden,
                  done && styles.lineDone,
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {ORDER_STATUS_STEPS.map((step, index) => {
          const done = index < currentIdx;
          const current = index === currentIdx;
          const label = formatOrderStatusShort(step, t);
          return (
            <View key={`${step}-label`} style={styles.labelCell}>
              <Text
                style={[
                  styles.label,
                  done && styles.labelDone,
                  current && styles.labelActive,
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default React.memo(OrderStatusStepsInner);
