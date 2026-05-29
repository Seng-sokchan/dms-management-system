import React from "react";
import { View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function SkeletonList({ count = 4, ItemComponent, itemProps }) {
  const { spacing } = useTheme();
  const Preset = ItemComponent;

  if (!Preset) return null;

  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <Preset key={i} {...itemProps} />
      ))}
      <View style={{ height: spacing.xxl }} />
    </View>
  );
}
