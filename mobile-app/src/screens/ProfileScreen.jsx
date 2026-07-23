import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import SettingsSection from "../components/settings/SettingsSection";
import { AppIcon, Card, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { deleteMyAccount } from "../services/authApi";

function pickLabel(user, key) {
  if (!user) return "—";
  const v = user[key];
  return v != null && String(v).trim() !== "" ? String(v) : "—";
}

function roleSubtitle(role, t) {
  if (role === "Admin") return t("profile.roleAdmin");
  if (role === "Owner") return t("profile.roleOwner");
  if (role === "Delivery") return t("profile.roleDelivery");
  if (role === "Depot") return t("profile.roleDepot");
  return t("profile.roleCustomer");
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { t } = useTranslation();
  const { showError, showAlert } = useAlert();
  const { colors, radii, spacing, typography, borders, sizes } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        dangerCard: {
          marginTop: spacing.lg,
        },
        dangerTitle: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        },
        dangerBody: {
          fontSize: typography.bodySmall,
          color: colors.textMuted,
          lineHeight: 20,
          marginBottom: spacing.md,
        },
        deleteButton: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          backgroundColor: colors.surfaceSoft,
          ...borders.panel,
          borderColor: colors.danger,
        },
        deleteLabel: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.danger,
        },
        scrollContent: {
          paddingBottom: sizes.tabBarOffset + spacing.lg,
        },
      }),
    [borders.panel, colors, radii, sizes.tabBarOffset, spacing, typography],
  );

  async function handleSignOut() {
    if (signingOut || deleting) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  async function performDeleteAccount() {
    if (!token || deleting) return;
    setDeleting(true);
    try {
      await deleteMyAccount(token);
      await logout();
    } catch (error) {
      showError(
        t("profile.deleteAccountFailed"),
        getApiErrorMessage(error, t("profile.deleteAccountFailedDefault")),
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleDeleteAccount() {
    if (signingOut || deleting) return;
    showAlert({
      tone: "warning",
      title: t("profile.deleteAccountTitle"),
      message: t("profile.deleteAccountMessage"),
      dismissible: true,
      actions: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.deleteAccountConfirm"),
          style: "destructive",
          onPress: () => {
            void performDeleteAccount();
          },
        },
      ],
    });
  }

  return (
    <Screen busy={signingOut || deleting}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader
          title={t("profile.title")}
          subtitle={roleSubtitle(user?.role, t)}
          rightAction={
            <Pressable
              onPress={handleSignOut}
              disabled={signingOut || deleting}
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
          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>{t("profile.phone")}</Text>
          <Text style={styles.fieldValue}>{pickLabel(user, "phone")}</Text>
        </Card>
        <SettingsSection />
        <Card style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>{t("profile.deleteAccount")}</Text>
          <Text style={styles.dangerBody}>{t("profile.deleteAccountHint")}</Text>
          <Pressable
            onPress={handleDeleteAccount}
            disabled={signingOut || deleting}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel={t("profile.deleteAccount")}
          >
            <AppIcon name="trash-can-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteLabel}>{t("profile.deleteAccount")}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </Screen>
  );
}
