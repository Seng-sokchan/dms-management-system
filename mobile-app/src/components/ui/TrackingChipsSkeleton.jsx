import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import SkeletonBone from "./SkeletonBone";

export default function TrackingChipsSkeleton({ count = 3 }) {
  const { spacing, radii } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          paddingVertical: spacing.xs,
        },
        chip: {
          marginRight: spacing.sm,
        },
      }),
    [spacing],
  );

  return (
    <View style={styles.row} accessible={false}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.chip}>
          <SkeletonBone width={96} height={44} borderRadius={radii.pill} />
        </View>
      ))}
    </View>
  );
}
