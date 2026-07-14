import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SCREEN_BG } from "./KhqrScanCard";

export default function KhqrCheckoutFooter({ amountLabel }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const summaryAmount = amountLabel || "—";

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>{t("payment.subtotal")}</Text>
        <Text style={styles.footerValue}>{summaryAmount}</Text>
      </View>
      <View style={styles.footerDivider} />
      <View style={styles.footerRow}>
        <Text style={styles.footerTotalLabel}>{t("payment.total")}</Text>
        <Text style={styles.footerTotalValue}>{summaryAmount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#C4C4CE",
    backgroundColor: SCREEN_BG,
    paddingTop: 14,
    paddingHorizontal: 24,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  footerLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  footerValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  footerDivider: {
    height: 1,
    backgroundColor: "#C4C4CE",
    marginVertical: 6,
  },
  footerTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  footerTotalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
});
