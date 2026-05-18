import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { AppIcon, Card, InputField, PrimaryButton, Screen } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex: {
          flex: 1,
          justifyContent: "center",
        },
        container: {
          justifyContent: "center",
        },
        brandWrap: {
          marginBottom: spacing.xl,
          alignItems: "center",
        },
        brandTitle: {
          fontSize: typography.h1,
          fontWeight: "800",
          color: colors.textPrimary,
          letterSpacing: -0.5,
        },
        brandSubtitle: {
          marginTop: spacing.sm,
          fontSize: typography.body,
          color: colors.textSecondary,
          textAlign: "center",
        },
        card: {
          borderRadius: radii.xl,
          paddingVertical: spacing.xxl,
        },
        passwordField: {
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        },
        helper: {
          color: colors.textMuted,
          fontSize: typography.caption,
          marginBottom: spacing.lg,
          lineHeight: 18,
        },
      }),
    [colors, radii, spacing, typography],
  );

  async function handleLogin() {
    const nextErrors = {
      username: username.trim() ? "" : t("auth.usernameRequired"),
      password: password.trim() ? "" : t("auth.passwordRequired"),
    };
    setErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) {
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (error) {
      Alert.alert(t("auth.loginFailed"), getApiErrorMessage(error, t("auth.loginFailedDefault")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.container} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.brandWrap}>
          <Text style={styles.brandTitle}>{t("auth.brandTitle")}</Text>
          <Text style={styles.brandSubtitle}>{t("auth.brandSubtitle")}</Text>
        </View>
        <Card style={styles.card}>
          <InputField
            label={t("auth.username")}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
            }}
            placeholder={t("auth.usernamePlaceholder")}
            autoCapitalize="none"
            error={errors.username}
          />
          <InputField
            label={t("auth.password")}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder={t("auth.passwordPlaceholder")}
            secureTextEntry
            style={styles.passwordField}
            error={errors.password}
          />
          <Text style={styles.helper}>{t("auth.helper")}</Text>
          <PrimaryButton
            title={t("auth.signIn")}
            onPress={handleLogin}
            loading={loading}
            icon={<AppIcon name="login" size={18} color={colors.onPrimary} />}
          />
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}
