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

function OptionRow({ label, selected, onPress, colors, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.langRow,
        selected && styles.langRowSelected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.langLabel, selected && styles.langLabelSelected]}>{label}</Text>
      {selected ? <Text style={styles.checkmark}>✓</Text> : null}
    </Pressable>
  );
}

export default function SettingsSection() {
  const { t, i18n } = useTranslation();
  const { colors, preference, setPreference } = useTheme();
  const currentLang = i18n.language?.startsWith("km") ? "km" : "en";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionTitle: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 12,
        },
        rowLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        },
        pillRow: {
          flexDirection: "row",
          gap: 8,
          marginBottom: 20,
        },
        pill: {
          flex: 1,
          paddingVertical: 10,
          paddingHorizontal: 8,
          borderRadius: 999,
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
          fontSize: 13,
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
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 8,
          backgroundColor: colors.surfaceSoft,
        },
        langRowSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.surfaceMuted,
        },
        langLabel: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        langLabelSelected: {
          fontWeight: "700",
        },
        checkmark: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.primary,
        },
      }),
    [colors],
  );

  return (
    <Card style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>{t("settings.title")}</Text>

      <Text style={styles.rowLabel}>{t("settings.theme")}</Text>
      <View style={styles.pillRow}>
        {THEME_OPTIONS.map((opt) => {
          const active = preference === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setPreference(opt.id)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{t(opt.labelKey)}</Text>
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
          colors={colors}
          styles={styles}
        />
      ))}
    </Card>
  );
}
