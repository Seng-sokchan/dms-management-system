import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { colors, radii, spacing, typography } from "../theme";

export default function QrModal({ visible, qrValue, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Pre-order successful</Text>
          <Text style={styles.subtitle}>Scan this QR code to confirm order details</Text>
          <View style={styles.qrWrap}>
            <QRCode value={qrValue || "DMS-SAMPLE-QR"} size={180} />
          </View>
          <Text style={styles.meta}>Present this code to finalize fulfillment</Text>
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.overlay,
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    textAlign: "center",
  },
  qrWrap: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  meta: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: typography.button,
  },
});
