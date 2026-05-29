import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useWindowDimensions } from "react-native";
import { getThemePreference, setThemePreference } from "../services/preferencesStorage";
import { darkColors, getFloatingTabBar, getShadows, lightColors } from "../theme/palettes";
import {
  getLayoutMetrics,
  getSemanticSizes,
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

export function ThemeProvider({ children, initialPreference = "system" }) {
  const [preference, setPreferenceState] = useState(initialPreference);
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme() || "light");
  const [hydrated, setHydrated] = useState(false);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    getThemePreference().then((saved) => {
      if (!cancelled) {
        setPreferenceState(saved);
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
  const floatingTabBar = getFloatingTabBar(colors);

  const layout = useMemo(() => getLayoutMetrics({ width, height }), [width, height]);
  const sizes = useMemo(() => getSemanticSizes({ width, height }), [width, height]);
  const scaledSpacing = useMemo(() => scaleSpacing(spacing, width), [width]);
  const scaledTypography = useMemo(() => scaleTypography(typography, width), [width]);
  const scaledRadii = useMemo(() => scaleRadii(radii, width), [width]);

  const setPreference = useCallback(async (next) => {
    setPreferenceState(next);
    await setThemePreference(next);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      resolvedMode,
      isDark: resolvedMode === "dark",
      hydrated,
      colors,
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
      resolvedMode,
      hydrated,
      colors,
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
