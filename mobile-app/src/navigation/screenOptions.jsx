import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
export function useStackScreenOptions() {
  const { colors, typography, borders } = useTheme();

  return useMemo(() => {
    const headerStyle = {
      backgroundColor: colors.background,
      ...borders.dividerBottom,
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
  }, [borders.dividerBottom, colors, typography]);
}

export function useFloatingTabScreenOptions() {
  const { colors, sizes } = useTheme();
  const tabBarOffset = sizes.tabBarOffset;

  return useMemo(
    () => ({
      headerShown: false,
      tabBarStyle: {
        position: "absolute",
        backgroundColor: "transparent",
        borderTopWidth: 0,
        elevation: 0,
        height: tabBarOffset,
      },
      sceneContainerStyle: {
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: tabBarOffset,
      },
    }),
    [colors.background, tabBarOffset],
  );
}

/** @deprecated Use useStackScreenOptions */
export const stackScreenOptions = {};

/** @deprecated Use useFloatingTabScreenOptions */
export const floatingTabScreenOptions = {};
