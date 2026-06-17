import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { changeAppLanguage } from "../../i18n/config";
import { Card } from "../ui";

const THEME_OPTIONS = [
  { id: "light", labelKey: "settings.themeLight" },
  { id: "dark", labelKey: "settings.themeDark" },
  { id: "system", labelKey: "settings.themeSystem" },
];

const LANG_OPTIONS = [
  { id: "en", labelKey: "language.en" },
  { id: "km", labelKey: "language.km" },
];

function OptionRow({ label, selected, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.langRow,
        selected && styles.langRowSelected,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.langLabel, selected && styles.langLabelSelected]}>{label}</Text>
      {selected ? <Text style={styles.checkmark}>✓</Text> : null}
    </Pressable>
  );
}

export default function SettingsSection() {
  const { t, i18n } = useTranslation();
  const { colors, preference, setPreference, spacing, typography, radii } = useTheme();
  const currentLang = i18n.language?.startsWith("km") ? "km" : "en";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionTitle: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        rowLabel: {
          fontSize: typography.caption,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: spacing.sm,
        },
        pillRow: {
          flexDirection: "row",
          gap: spacing.sm,
          marginBottom: spacing.xl,
        },
        pill: {
          flex: 1,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          borderRadius: radii.pill,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceSoft,
          alignItems: "center",
        },
        pillActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        pillText: {
          fontSize: typography.bodySmall,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        pillTextActive: {
          color: colors.onPrimary,
        },
        langRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.sm,
          backgroundColor: colors.surfaceSoft,
        },
        langRowSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.surfaceMuted,
        },
        langLabel: {
          fontSize: typography.body,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        langLabelSelected: {
          fontWeight: "700",
        },
        checkmark: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.primary,
        },
      }),
    [colors, radii, spacing, typography],
  );

  return (
    <Card style={{ marginTop: spacing.lg }}>
      <Text style={styles.sectionTitle}>{t("settings.title")}</Text>

      <Text style={styles.rowLabel}>{t("settings.theme")}</Text>
      <View style={styles.pillRow} accessibilityRole="radiogroup">
        {THEME_OPTIONS.map((opt) => {
          const active = preference === opt.id;
          const label = t(opt.labelKey);
          return (
            <Pressable
              key={opt.id}
              onPress={() => setPreference(opt.id)}
              style={[styles.pill, active && styles.pillActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.rowLabel}>{t("settings.language")}</Text>
      {LANG_OPTIONS.map((opt) => (
        <OptionRow
          key={opt.id}
          label={t(opt.labelKey)}
          selected={currentLang === opt.id}
          onPress={() => changeAppLanguage(opt.id)}
          styles={styles}
        />
      ))}
    </Card>
  );
}
