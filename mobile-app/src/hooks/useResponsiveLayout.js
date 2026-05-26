import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  getLayoutMetrics,
  getSemanticSizes,
  horizontalScale,
  moderateScale,
  verticalScale,
} from "../theme/responsive";

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const layout = getLayoutMetrics({ width, height });
    const sizes = getSemanticSizes({ width, height });

    return {
      layout,
      sizes,
      horizontalScale: (size) => horizontalScale(size, width),
      verticalScale: (size) => verticalScale(size, height),
      moderateScale: (size, factor) => moderateScale(size, width, factor),
    };
  }, [width, height]);
}
