import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { AppIcon, Card, InputField, PrimaryButton, Screen } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
const logoImage = require("../../assets/images/logo.png");

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const { colors, layout, spacing, typography } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function scrollToFocusedField() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  const logoSize = useMemo(() => {
    const min = 130;
    const max = layout.isTablet ? 180 : 200;
    const target = screenWidth * (layout.isTablet ? 0.36 : 0.48);
    return Math.round(Math.min(Math.max(target, min), max));
  }, [layout.isTablet, screenWidth]);

  const isCompact = screenHeight < 700;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
        },
        flex: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          justifyContent: keyboardVisible ? "flex-start" : "center",
          paddingTop: keyboardVisible ? spacing.md : isCompact ? spacing.lg : spacing.xxl,
          paddingBottom: keyboardVisible ? spacing.xxl : isCompact ? spacing.lg : spacing.xxl,
        },
        body: {
          width: "100%",
        },
        brandWrap: {
          alignItems: "center",
          marginBottom: keyboardVisible ? 0 : isCompact ? spacing.lg : spacing.xxl,
          height: keyboardVisible ? 0 : undefined,
          overflow: "hidden",
          opacity: keyboardVisible ? 0 : 1,
        },
        logo: {
          width: logoSize,
          height: logoSize,
        },
        card: {
          paddingVertical: spacing.xl,
        },
        cardTitle: {
          fontSize: typography.h2,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.lg,
          textAlign: "center",
        },
        fieldSpaced: {
          marginTop: spacing.md,
        },
        helper: {
          color: colors.textMuted,
          fontSize: typography.caption,
          marginTop: spacing.md,
          marginBottom: spacing.lg,
          lineHeight: 18,
          textAlign: "center",
        },
      }),
    [colors.textMuted, colors.textPrimary, isCompact, keyboardVisible, logoSize, spacing, typography.h2],
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
    <Screen
      contentStyle={styles.screen}
      edges={["top", "left", "right"]}
      busy={loading}
      busyMessage={t("auth.signIn")}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable onPress={Keyboard.dismiss} style={styles.body}>
            <View style={styles.brandWrap}>
              <Image
                source={logoImage}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel={t("auth.brandTitle")}
              />
            </View>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{t("auth.signIn")}</Text>
              <InputField
                label={t("auth.username")}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
                }}
                placeholder={t("auth.usernamePlaceholder")}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={scrollToFocusedField}
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={scrollToFocusedField}
                style={styles.fieldSpaced}
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
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
