import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import { useTheme } from "../context/ThemeContext";

export default function QrModal({ visible, qrValue, onClose }) {
  const { t } = useTranslation();
  const { colors, layout, radii, sizes, spacing, typography } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.overlay,
          padding: spacing.lg,
        },
        card: {
          width: "100%",
          maxWidth: layout.modalMaxWidth,
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          padding: spacing.xl,
          alignItems: "center",
        },
        title: {
          fontSize: typography.h3,
          fontWeight: "800",
          color: colors.textPrimary,
          textAlign: "center",
        },
        subtitle: {
          marginTop: spacing.sm,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 18,
        },
        qrWrap: {
          marginVertical: spacing.xl,
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
        },
        meta: {
          fontSize: typography.caption,
          color: colors.textMuted,
          textAlign: "center",
          marginBottom: spacing.lg,
        },
        button: {
          backgroundColor: colors.primary,
          borderRadius: radii.pill,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xxl,
          minWidth: sizes.modalButtonMinWidth,
        },
        buttonPressed: {
          opacity: 0.9,
        },
        buttonText: {
          color: colors.onPrimary,
          fontWeight: "700",
          fontSize: typography.button,
          textAlign: "center",
        },
      }),
    [colors, layout.modalMaxWidth, radii, sizes.modalButtonMinWidth, spacing, typography],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("qr.title")}</Text>
          <Text style={styles.subtitle}>{t("qr.subtitle")}</Text>
          <View style={styles.qrWrap}>
            <QRCode value={qrValue || "DMS-SAMPLE-QR"} size={180} />
          </View>
          <Text style={styles.meta}>{t("qr.meta")}</Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>{t("qr.close")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
