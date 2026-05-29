import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import SettingsSection from "../components/settings/SettingsSection";
import { AppIcon, Card, Screen, SectionHeader } from "../components/ui";

function pickLabel(user, key) {
  if (!user) return "—";
  const v = user[key];
  return v != null && String(v).trim() !== "" ? String(v) : "—";
}

function roleSubtitle(role, t) {
  if (role === "Delivery") return t("profile.roleDelivery");
  if (role === "Depot") return t("profile.roleDepot");
  return t("profile.roleCustomer");
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        signOutButton: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceSoft,
        },
        signOutLabel: {
          fontSize: typography.bodySmall,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        fieldLabel: {
          fontSize: typography.caption,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        fieldLabelSpaced: {
          marginTop: spacing.lg,
        },
        fieldValue: {
          marginTop: spacing.xs,
          fontSize: typography.body,
          fontWeight: "600",
          color: colors.textPrimary,
        },
      }),
    [colors, radii, spacing, typography],
  );

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen busy={signingOut}>
      <SectionHeader
        title={t("profile.title")}
        subtitle={roleSubtitle(user?.role, t)}
        rightAction={
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            hitSlop={8}
            style={styles.signOutButton}
            accessibilityRole="button"
            accessibilityLabel={t("profile.signOut")}
          >
            <AppIcon name="logout" size={18} color={colors.textPrimary} />
            <Text style={styles.signOutLabel}>{t("profile.signOut")}</Text>
          </Pressable>
        }
      />
      <Card>
        <Text style={styles.fieldLabel}>{t("profile.username")}</Text>
        <Text style={styles.fieldValue}>{pickLabel(user, "username")}</Text>
        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>{t("profile.name")}</Text>
        <Text style={styles.fieldValue}>{pickLabel(user, "name")}</Text>
        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>{t("profile.role")}</Text>
        <Text style={styles.fieldValue}>{pickLabel(user, "role")}</Text>
        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>{t("profile.email")}</Text>
        <Text style={styles.fieldValue}>{pickLabel(user, "email")}</Text>
      </Card>
      <SettingsSection />
    </Screen>
  );
}
