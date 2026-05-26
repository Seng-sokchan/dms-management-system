import { lightColors } from "./palettes";
import { radii, spacing, typography } from "./tokens";
import { getShadows, getFloatingTabBar } from "./palettes";

/** Static tokens (mode-independent) */
export { spacing, radii, typography } from "./tokens";
export {
  BASE_WIDTH,
  CONTENT_MAX_WIDTH,
  MODAL_MAX_WIDTH,
  TABLET_MIN_WIDTH,
  getLayoutMetrics,
  getSemanticSizes,
  horizontalScale,
  moderateScale,
  verticalScale,
} from "./responsive";
export { useResponsiveLayout } from "../hooks/useResponsiveLayout";

export { useTheme } from "../context/ThemeContext";
export { useThemedStyles } from "./useThemedStyles";

/** @deprecated Use useTheme() for colors */
export const colors = lightColors;
export const customerColors = lightColors;

/** @deprecated */
export const floatingTabBar = getFloatingTabBar(lightColors);

/** @deprecated */
export const shadows = getShadows();

/** @deprecated */
export const appTheme = {
  colors: lightColors,
  spacing,
  radii,
  typography,
  shadows: getShadows(),
  floatingTabBar: getFloatingTabBar(lightColors),
};
