import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useWindowDimensions } from "react-native";
import {
  getFontSizePreference,
  getThemePreference,
  setFontSizePreference as persistFontSizePreference,
  setThemePreference,
} from "../services/preferencesStorage";
import { darkColors, getBorders, getFloatingTabBar, getShadows, lightColors } from "../theme/palettes";
import {
  getLayoutMetrics,
  getSemanticSizes,
  applyFontSizeScale,
  scaleRadii,
  scaleSpacing,
  scaleTypography,
} from "../theme/responsive";
import { radii, spacing, typography } from "../theme/tokens";

const ThemeContext = createContext(null);

function resolveMode(preference, systemScheme) {
  if (preference === "light" || preference === "dark") return preference;
  return systemScheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children, initialPreference = "system", initialFontSize = "medium" }) {
  const [preference, setPreferenceState] = useState(initialPreference);
  const [fontSizePreference, setFontSizePreferenceState] = useState(initialFontSize);
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme() || "light");
  const [hydrated, setHydrated] = useState(false);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    Promise.all([getThemePreference(), getFontSizePreference()]).then(([savedTheme, savedFontSize]) => {
      if (!cancelled) {
        setPreferenceState(savedTheme);
        setFontSizePreferenceState(savedFontSize);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || "light");
    });
    return () => sub.remove();
  }, []);

  const resolvedMode = resolveMode(preference, systemScheme);
  const colors = resolvedMode === "dark" ? darkColors : lightColors;
  const shadows = getShadows();
  const borders = getBorders(colors);
  const floatingTabBar = getFloatingTabBar(colors);

  const layout = useMemo(() => getLayoutMetrics({ width, height }), [width, height]);
  const sizes = useMemo(() => getSemanticSizes({ width, height }), [width, height]);
  const scaledSpacing = useMemo(() => scaleSpacing(spacing, width), [width]);
  const scaledTypography = useMemo(
    () => applyFontSizeScale(scaleTypography(typography, width), fontSizePreference),
    [width, fontSizePreference],
  );
  const scaledRadii = useMemo(() => scaleRadii(radii, width), [width]);

  const setPreference = useCallback(async (next) => {
    setPreferenceState(next);
    await setThemePreference(next);
  }, []);

  const setFontSizePreference = useCallback(async (next) => {
    setFontSizePreferenceState(next);
    await persistFontSizePreference(next);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      fontSizePreference,
      setFontSizePreference,
      resolvedMode,
      isDark: resolvedMode === "dark",
      hydrated,
      colors,
      borders,
      shadows,
      floatingTabBar,
      spacing: scaledSpacing,
      radii: scaledRadii,
      typography: scaledTypography,
      layout,
      sizes,
    }),
    [
      preference,
      setPreference,
      fontSizePreference,
      setFontSizePreference,
      resolvedMode,
      hydrated,
      colors,
      borders,
      shadows,
      floatingTabBar,
      scaledSpacing,
      scaledRadii,
      scaledTypography,
      layout,
      sizes,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
