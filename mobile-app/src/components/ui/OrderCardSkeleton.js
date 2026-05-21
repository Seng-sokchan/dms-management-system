import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";
import SkeletonBone from "./SkeletonBone";

export default function OrderCardSkeleton({ showActions = false }) {
  const { spacing, radii } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: spacing.md,
        },
        line: {
          marginTop: spacing.xs,
        },
        actions: {
          flexDirection: "row",
          gap: spacing.sm,
          marginTop: spacing.md,
        },
      }),
    [spacing],
  );

  return (
    <Card style={styles.card} accessible={false}>
      <SkeletonBone width="35%" height={20} borderRadius={radii.sm} />
      <View style={styles.line}>
        <SkeletonBone width="85%" height={14} borderRadius={radii.sm} />
      </View>
      <View style={styles.line}>
        <SkeletonBone width="75%" height={14} borderRadius={radii.sm} />
      </View>
      <View style={styles.line}>
        <SkeletonBone width="55%" height={12} borderRadius={radii.sm} />
      </View>
      {showActions ? (
        <View style={styles.actions}>
          <SkeletonBone width={88} height={32} borderRadius={radii.pill} />
          <SkeletonBone width={88} height={32} borderRadius={radii.pill} />
        </View>
      ) : null}
    </Card>
  );
}
