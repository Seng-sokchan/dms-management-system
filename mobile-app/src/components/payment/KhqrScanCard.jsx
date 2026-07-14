import React, { useMemo } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useTranslation } from "react-i18next";
import { buildQrImageUri } from "../../utils/buildQrImageUri";
import { ABA_KHQR_RED, ABA_KHQR_TEAL, ABA_KHQR_WHITE } from "../../theme/abaKhqrBrand";

const CARD_BG = "#FFFFFF";
const SCREEN_BG = "#F3F4F6";

function DashedDivider() {
  return (
    <View style={dividerStyles.wrap}>
      {Array.from({ length: 28 }).map((_, index) => (
        <View
          key={`dash-${index}`}
          style={[dividerStyles.dash, index % 2 === 0 ? dividerStyles.dashVisible : dividerStyles.dashGap]}
        />
      ))}
    </View>
  );
}

/**
 * KHQR ticket card: red header, amount, perforated divider, QR code.
 */
export default function KhqrScanCard({
  amountLabel,
  merchantName,
  qrString,
  qrImageUrl,
  loading = false,
  qrSize = 220,
}) {
  const { t } = useTranslation();
  const qrUri = useMemo(() => buildQrImageUri(qrImageUrl, qrString), [qrImageUrl, qrString]);
  const useSvgQr = Boolean(qrString) && !qrImageUrl;

  return (
    <View style={styles.card}>
      <View style={styles.redHeader}>
        <Text style={styles.khqrLabel}>KHQR</Text>
        <View style={styles.headerNotch} />
      </View>

      <View style={styles.body}>
        {merchantName ? (
          <Text style={styles.merchantName} numberOfLines={2}>
            {merchantName}
          </Text>
        ) : (
          <Text style={styles.amountCaption}>{t("payment.amountToPay")}</Text>
        )}
        {amountLabel ? <Text style={styles.amountValue}>{amountLabel}</Text> : null}

        <DashedDivider />

        <View style={[styles.qrWrap, { width: qrSize, height: qrSize }]}>
          {loading ? (
            <ActivityIndicator color={ABA_KHQR_TEAL} size="large" />
          ) : useSvgQr ? (
            <QRCode value={qrString} size={qrSize - 8} quietZone={4} />
          ) : qrUri ? (
            <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
          ) : (
            <Text style={styles.noQr}>{t("payment.khqrNoQr")}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export { SCREEN_BG };

const dividerStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    overflow: "hidden",
  },
  dash: {
    width: 6,
    height: 1,
    borderRadius: 1,
  },
  dashVisible: {
    backgroundColor: "#9898A8",
  },
  dashGap: {
    backgroundColor: "transparent",
  },
});

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#C4C4CE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  redHeader: {
    backgroundColor: ABA_KHQR_RED,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  khqrLabel: {
    color: ABA_KHQR_WHITE,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  headerNotch: {
    position: "absolute",
    right: 0,
    bottom: -10,
    width: 20,
    height: 20,
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 12,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  amountCaption: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  qrWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CARD_BG,
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  noQr: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
