import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getStoredFontSizePreference,
  getStoredThemePreference,
  resolveTheme,
  setStoredFontSizePreference,
  setStoredThemePreference,
} from "../preferences";

const PortalPreferencesContext = createContext(null);

export function PortalPreferencesProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState(getStoredThemePreference);
  const [fontSizePreference, setFontSizePreferenceState] = useState(getStoredFontSizePreference);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(getStoredThemePreference()));

  useEffect(() => {
    setStoredThemePreference(themePreference);
    const apply = () => setResolvedTheme(resolveTheme(themePreference));
    apply();

    if (themePreference !== "system" || typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply();
    media.addEventListener?.("change", onChange);
    media.addListener?.(onChange);
    return () => {
      media.removeEventListener?.("change", onChange);
      media.removeListener?.(onChange);
    };
  }, [themePreference]);

  useEffect(() => {
    setStoredFontSizePreference(fontSizePreference);
  }, [fontSizePreference]);

  const setThemePreference = useCallback((value) => {
    setThemePreferenceState(value);
  }, []);

  const setFontSizePreference = useCallback((value) => {
    setFontSizePreferenceState(value);
  }, []);

  const value = useMemo(
    () => ({
      themePreference,
      setThemePreference,
      fontSizePreference,
      setFontSizePreference,
      resolvedTheme,
    }),
    [
      fontSizePreference,
      resolvedTheme,
      setFontSizePreference,
      setThemePreference,
      themePreference,
    ],
  );

  return (
    <PortalPreferencesContext.Provider value={value}>{children}</PortalPreferencesContext.Provider>
  );
}

export function usePortalPreferences() {
  const ctx = useContext(PortalPreferencesContext);
  if (!ctx) {
    throw new Error("usePortalPreferences must be used inside PortalPreferencesProvider");
  }
  return ctx;
}
