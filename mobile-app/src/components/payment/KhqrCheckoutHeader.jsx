import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AppIcon from "../ui/AppIcon";

export default function KhqrCheckoutHeader({ onClose }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Pressable
        style={styles.backBtn}
        onPress={onClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t("delivery.back")}
      >
        <AppIcon name="arrow-left" size={22} color="#111827" />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {t("payment.methodAbaKhqr")}
      </Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
});
