import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

const SKY = "#D9ECF2";
const HILL = "#B8D9E8";
const CACTUS = "#9CC7D8";
const POLE = "#8AA4BF";
const SUCCESS_GREEN = "#42B56E";

const CX = 140;
const BADGE_CY = 78;
const BADGE_R = 30;

export default function PaymentSuccessIllustration() {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={280} height={200} viewBox="0 0 280 200">
        <Rect x="0" y="0" width="280" height="200" fill={SKY} rx="20" />

        <Ellipse cx="72" cy="52" rx="28" ry="14" fill="#FFFFFF" opacity="0.85" />
        <Ellipse cx="210" cy="44" rx="34" ry="16" fill="#FFFFFF" opacity="0.85" />
        <Ellipse cx="150" cy="36" rx="22" ry="11" fill="#FFFFFF" opacity="0.7" />

        <Ellipse cx={CX} cy="168" rx="150" ry="40" fill={HILL} />
        <Path d="M48 158 C 64 132, 92 140, 108 158 Z" fill={CACTUS} />
        <Path d="M196 158 C 212 130, 238 138, 252 158 Z" fill={CACTUS} />

        <Rect x="48" y="118" width="10" height="42" rx="3" fill={CACTUS} />
        <Rect x="38" y="128" width="30" height="8" rx="4" fill={CACTUS} />
        <Rect x="222" y="112" width="10" height="48" rx="3" fill={CACTUS} />
        <Rect x="212" y="122" width="30" height="8" rx="4" fill={CACTUS} />

        <Rect x={CX - 2} y="54" width="4" height="104" fill={POLE} rx="2" />
        <Path d={`M${CX + 2} 56 L${CX + 2} 100 L${CX + 38} ${BADGE_CY} Z`} fill="#FFFFFF" />

        <Circle cx={CX} cy={BADGE_CY} r={BADGE_R} fill={SUCCESS_GREEN} />
        <Path
          d={`M${CX - 12} ${BADGE_CY} L${CX - 4} ${BADGE_CY + 8} L${CX + 12} ${BADGE_CY - 8}`}
          stroke="#FFFFFF"
          strokeWidth="5"
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
  },
});
