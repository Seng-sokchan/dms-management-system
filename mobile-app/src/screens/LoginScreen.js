import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { AppIcon, Card, InputField, PrimaryButton } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { colors, radii, spacing, typography } from "../theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });

  async function handleLogin() {
    const nextErrors = {
      username: username.trim() ? "" : "Username is required",
      password: password.trim() ? "" : "Password is required",
    };
    setErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) {
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (error) {
      Alert.alert("Login failed", getApiErrorMessage(error, "Unable to login"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.brandWrap}>
          <Text style={styles.brandTitle}>DMS Mobile</Text>
          <Text style={styles.brandSubtitle}>Customer ordering and delivery tracking</Text>
        </View>
        <Card style={styles.card}>
          <InputField
            label="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
            }}
            placeholder="Enter your username"
            autoCapitalize="none"
            error={errors.username}
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="Enter your password"
            secureTextEntry
            style={styles.passwordField}
            error={errors.password}
          />
          <Text style={styles.helper}>Use your Customer or Delivery account to continue</Text>
          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            icon={<AppIcon name="login" size={18} color="#fff" />}
          />
        </Card>
      </KeyboardAvoidingView>
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
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  brandWrap: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  brandTitle: {
    fontSize: typography.h1,
    fontWeight: "800",
    color: colors.textPrimary,
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
    backgroundColor: colors.surface,
  },
  passwordField: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  helper: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginBottom: spacing.lg,
  },
});
