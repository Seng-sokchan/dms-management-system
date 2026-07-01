import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ABA_KHQR_RED, ABA_KHQR_TEAL, ABA_KHQR_WHITE } from "../../theme/abaKhqrBrand";

const CARD_BLUE = "#1F4FD8";
const ALIPAY_BLUE = "#1677FF";
const WECHAT_GREEN = "#07C160";

export function AbaKhqrMethodIcon({ size = 44 }) {
  const topHeight = Math.round(size * 0.62);
  const bottomHeight = size - topHeight;

  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size * 0.18 }]}>
      <View style={[styles.logoTop, { height: topHeight, backgroundColor: ABA_KHQR_TEAL }]}>
        <Text style={[styles.abaText, { fontSize: size * 0.24 }]}>ABA</Text>
      </View>
      <View style={[styles.logoBottom, { height: bottomHeight, backgroundColor: ABA_KHQR_RED }]}>
        <Text style={[styles.khqrText, { fontSize: size * 0.16 }]}>KHQR</Text>
      </View>
    </View>
  );
}

export function AbaKhqrLogoMark({ size = 36 }) {
  return <AbaKhqrMethodIcon size={size} />;
}

export function CardMethodIcon() {
  return (
    <View style={[styles.base, { backgroundColor: CARD_BLUE }]}>
      <View style={styles.cardChip} />
      <View style={styles.cardStripe} />
    </View>
  );
}

export function AlipayMethodIcon() {
  return (
    <View style={[styles.base, styles.round, { backgroundColor: ALIPAY_BLUE }]}>
      <Text style={styles.alipayText}>支</Text>
    </View>
  );
}

export function WeChatMethodIcon() {
  return (
    <View style={[styles.base, styles.round, { backgroundColor: WECHAT_GREEN }]}>
      <Text style={styles.wechatText}>W</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    overflow: "hidden",
  },
  logoTop: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoBottom: {
    alignItems: "center",
    justifyContent: "center",
  },
  abaText: {
    color: ABA_KHQR_WHITE,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  khqrText: {
    color: ABA_KHQR_WHITE,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  base: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  round: {
    borderRadius: 22,
  },
  cardChip: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 12,
    height: 9,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  cardStripe: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  alipayText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  wechatText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});
