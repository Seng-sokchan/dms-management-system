import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { AppIcon, Card, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { colors, spacing, typography } from "../theme";

function pickLabel(user, key) {
  if (!user) return "—";
  const v = user[key];
  return v != null && String(v).trim() !== "" ? String(v) : "—";
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Screen style={styles.container}>
        <SectionHeader
          title="Your account"
          subtitle={user?.role === "Delivery" ? "Delivery driver" : "Signed in as a customer"}
        />
        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Username</Text>
          <Text style={styles.fieldValue}>{pickLabel(user, "username")}</Text>
          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Name</Text>
          <Text style={styles.fieldValue}>{pickLabel(user, "name")}</Text>
          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Role</Text>
          <Text style={styles.fieldValue}>{pickLabel(user, "role")}</Text>
          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Email</Text>
          <Text style={styles.fieldValue}>{pickLabel(user, "email")}</Text>
        </Card>
        <PrimaryButton
          title="Sign out"
          onPress={logout}
          style={styles.signOut}
          icon={<AppIcon name="logout" size={18} color="#fff" />}
        />
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  card: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fieldLabelSpaced: {
    marginTop: spacing.md,
  },
  fieldValue: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  signOut: {
    marginTop: spacing.xl,
    alignSelf: "stretch",
  },
});
