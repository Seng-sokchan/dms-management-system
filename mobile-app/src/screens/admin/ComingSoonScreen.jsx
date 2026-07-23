import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppIcon, Screen } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

export default function ComingSoonScreen({ route }) {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const title = route?.params?.title || t("admin.comingSoon.title");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.xl,
        },
        title: {
          marginTop: spacing.lg,
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
          textAlign: "center",
        },
        body: {
          marginTop: spacing.sm,
          fontSize: typography.body,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
        },
      }),
    [colors, spacing, typography],
  );

  return (
    <Screen>
      <View style={styles.wrap}>
        <AppIcon name="clock-outline" size={48} color={colors.textMuted} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{t("admin.comingSoon.body")}</Text>
      </View>
    </Screen>
  );
}
