import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { ABA_KHQR_RED, ABA_KHQR_TEAL } from "../../theme/abaKhqrBrand";

const SKY = "#D9ECF2";
const HILL = "#B8D9E8";

export default function PaymentSuccessIllustration() {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={220} height={160} viewBox="0 0 220 160">
        <Rect x="0" y="0" width="220" height="160" fill={SKY} rx="18" />
        <Ellipse cx="110" cy="128" rx="120" ry="34" fill={HILL} />
        <Path d="M36 118 C 52 96, 78 104, 92 118 Z" fill="#9CC7D8" />
        <Path d="M150 118 C 166 94, 188 102, 198 118 Z" fill="#9CC7D8" />
        <Rect x="108" y="42" width="4" height="76" fill="#8AA4BF" rx="2" />
        <Circle cx="110" cy="42" r="24" fill={ABA_KHQR_TEAL} />
        <Circle cx="110" cy="42" r="14" fill={ABA_KHQR_RED} />
        <Path
          d="M101 42 L108 49 L121 35"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
});
