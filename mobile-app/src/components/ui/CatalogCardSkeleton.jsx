import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";
import SkeletonBone from "./SkeletonBone";

export default function CatalogCardSkeleton() {
  const { spacing, radii } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: spacing.md,
        },
        gap: {
          marginTop: spacing.xs,
        },
        button: {
          marginTop: spacing.md,
        },
      }),
    [spacing],
  );

  return (
    <Card style={styles.card} accessible={false}>
      <SkeletonBone width="70%" height={20} borderRadius={radii.sm} />
      <View style={styles.gap}>
        <SkeletonBone width="40%" height={14} borderRadius={radii.sm} />
      </View>
      <View style={styles.button}>
        <SkeletonBone width={120} height={36} borderRadius={radii.pill} />
      </View>
    </Card>
  );
}
