import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";
import SkeletonBone, { SkeletonRow } from "./SkeletonBone";

export default function DepotCustomerCardSkeleton() {
  const { spacing, radii } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: spacing.md,
        },
        header: {
          justifyContent: "space-between",
        },
        meta: {
          marginTop: spacing.xs,
        },
        line: {
          marginTop: spacing.md,
        },
      }),
    [spacing],
  );

  return (
    <Card style={styles.card} accessible={false}>
      <SkeletonRow style={styles.header}>
        <View style={{ flex: 1 }}>
          <SkeletonBone width="60%" height={20} borderRadius={radii.sm} />
          <View style={styles.meta}>
            <SkeletonBone width="45%" height={14} borderRadius={radii.sm} />
          </View>
        </View>
        <SkeletonBone width={72} height={32} borderRadius={radii.pill} />
      </SkeletonRow>
      <View style={styles.line}>
        <SkeletonBone width="90%" height={14} borderRadius={radii.sm} />
      </View>
      <View style={styles.line}>
        <SkeletonBone width="70%" height={14} borderRadius={radii.sm} />
      </View>
    </Card>
  );
}
