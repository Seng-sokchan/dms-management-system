import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

/** Build StyleSheet from theme-aware factory: `(theme) => ({ key: { ... } })` */
export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}
