import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { PrimaryButton, Screen } from "../components/ui";

export default function LegalDocumentScreen({ route }) {
  const url = route.params?.url;
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        webView: {
          flex: 1,
          backgroundColor: colors.background,
        },
        loader: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        },
        errorWrap: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
        },
        errorText: {
          fontSize: typography.body,
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 22,
        },
      }),
    [colors.background, colors.textMuted, spacing.md, spacing.xl, typography.body],
  );

  if (!url) {
    return (
      <Screen>
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{t("legal.loadError")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <WebView
        key={reloadKey}
        source={{ uri: url }}
        style={styles.webView}
        onLoadStart={() => {
          setLoading(true);
          setLoadError(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setLoadError(true);
        }}
        onHttpError={() => {
          setLoading(false);
          setLoadError(true);
        }}
        startInLoadingState={false}
        showsVerticalScrollIndicator
        accessibilityLabel={route.params?.title}
      />
      {loading && !loadError ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
      {loadError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{t("legal.loadError")}</Text>
          <PrimaryButton
            title={t("common.tryAgain")}
            onPress={() => {
              setLoadError(false);
              setLoading(true);
              setReloadKey((value) => value + 1);
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}
