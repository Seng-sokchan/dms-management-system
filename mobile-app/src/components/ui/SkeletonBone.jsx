import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const PULSE_DURATION_MS = 1200;
const OPACITY_MIN = 0.45;
const OPACITY_MAX = 1;

export default function SkeletonBone({ width, height, borderRadius, style }) {
  const { colors, radii } = useTheme();
  const opacity = useRef(new Animated.Value(OPACITY_MIN)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: OPACITY_MAX,
          duration: PULSE_DURATION_MS / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: OPACITY_MIN,
          duration: PULSE_DURATION_MS / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bone: {
          backgroundColor: colors.surfaceSoft,
          borderRadius: borderRadius ?? radii.sm,
          width,
          height,
        },
      }),
    [borderRadius, colors.surfaceSoft, height, radii.sm, width],
  );

  return (
    <Animated.View style={[styles.bone, style, { opacity }]} accessible={false} />
  );
}

export function SkeletonRow({ gap, children, style }) {
  const { spacing } = useTheme();
  const rowGap = gap ?? spacing.sm;
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: rowGap }, style]} accessible={false}>
      {children}
    </View>
  );
}
