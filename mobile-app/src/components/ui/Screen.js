import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export default function Screen({
  children,
  style,
  contentStyle,
  edges = ["top", "left", "right"],
  ...rest
}) {
  const { colors, spacing, layout } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
          paddingHorizontal: spacing.lg,
        },
        inner: {
          flex: 1,
          width: "100%",
          maxWidth: layout.isTablet ? layout.contentMaxWidth : undefined,
          alignSelf: layout.isTablet ? "center" : undefined,
        },
      }),
    [colors.background, spacing.lg, layout.isTablet, layout.contentMaxWidth],
  );

  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges} {...rest}>
      <View style={[styles.content, contentStyle]}>
        <View style={styles.inner}>{children}</View>
      </View>
    </SafeAreaView>
  );
}
