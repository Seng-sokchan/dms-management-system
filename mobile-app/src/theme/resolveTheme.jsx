import { useTheme } from "../context/ThemeContext";

/** @deprecated Use useTheme() hook instead */
export function resolveTheme() {
  return { colors: require("./palettes").lightColors, shadows: require("./palettes").getShadows() };
}

export { useTheme };
