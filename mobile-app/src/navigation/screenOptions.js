import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { FLOATING_TAB_BAR_OFFSET } from "../components/navigation/FloatingTabBar";

export function useStackScreenOptions() {
  const { colors, typography } = useTheme();

  return useMemo(() => {
    const headerStyle = {
      backgroundColor: colors.background,
      borderBottomWidth: 0,
    };
    const headerTitleStyle = {
      fontSize: typography.h3,
      fontWeight: "800",
      color: colors.textPrimary,
    };

    return {
      headerStyle,
      headerShadowVisible: false,
      headerTitleStyle,
      headerTitleAlign: "left",
      headerTintColor: colors.textPrimary,
      contentStyle: { flex: 1, backgroundColor: colors.background },
      animation: "slide_from_right",
    };
  }, [colors, typography]);
}

export function useFloatingTabScreenOptions() {
  const { colors } = useTheme();

  return useMemo(
    () => ({
      headerShown: false,
      tabBarStyle: {
        position: "absolute",
        backgroundColor: "transparent",
        borderTopWidth: 0,
        elevation: 0,
        height: FLOATING_TAB_BAR_OFFSET,
      },
      sceneContainerStyle: {
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: FLOATING_TAB_BAR_OFFSET,
      },
    }),
    [colors.background],
  );
}

/** @deprecated Use useStackScreenOptions */
export const stackScreenOptions = {};

/** @deprecated Use useFloatingTabScreenOptions */
export const floatingTabScreenOptions = {};
