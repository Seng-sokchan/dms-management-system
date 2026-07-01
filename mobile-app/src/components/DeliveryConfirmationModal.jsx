import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import InputField from "./ui/InputField";

function parseNonNegativeInt(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return 0;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export default function DeliveryConfirmationModal({
  visible,
  order,
  submitting,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  const { colors, layout, radii, spacing, typography, borders } = useTheme();
  const [lossText, setLossText] = useState("0");
  const [fieldError, setFieldError] = useState("");

  const orderedQty = Number(order?.orderedQty ?? 0);
  const lossQty = parseNonNegativeInt(lossText);
  const deliveredQty =
    lossQty != null && lossQty <= orderedQty ? Math.max(0, orderedQty - lossQty) : null;

  useEffect(() => {
    if (visible) {
      setLossText("0");
      setFieldError("");
    }
  }, [visible, order?.id]);

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
          padding: spacing.lg,
          ...borders.panel,
        },
        title: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        },
        line: {
          fontSize: typography.body,
          color: colors.textSecondary,
          marginBottom: spacing.xs,
        },
        statRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing.sm,
          marginBottom: spacing.xs,
        },
        statLabel: {
          fontSize: typography.body,
          color: colors.textMuted,
        },
        statValue: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        actions: {
          flexDirection: "row",
          gap: spacing.sm,
          marginTop: spacing.lg,
        },
        btn: {
          flex: 1,
          borderRadius: radii.pill,
          paddingVertical: spacing.md,
          alignItems: "center",
        },
        btnPrimary: {
          backgroundColor: colors.primary,
        },
        btnSecondary: {
          backgroundColor: colors.surfaceSoft,
          ...borders.panel,
        },
        btnTextPrimary: {
          color: colors.onPrimary,
          fontWeight: "700",
        },
        btnTextSecondary: {
          color: colors.textPrimary,
          fontWeight: "600",
        },
      }),
    [borders.panel, colors, layout.modalMaxWidth, radii, spacing, typography],
  );

  function validate() {
    if (lossQty == null) {
      setFieldError(t("delivery.confirmInvalidLoss"));
      return false;
    }
    if (lossQty > orderedQty) {
      setFieldError(t("delivery.confirmLossExceedsOrdered"));
      return false;
    }
    setFieldError("");
    return true;
  }

  function handleConfirmPress() {
    if (!validate()) return;
    onConfirm?.({ lossQty });
  }

  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t("delivery.confirmTitle")}</Text>
          <Text style={styles.line}>
            {t("delivery.confirmOrder", { id: order.id, name: order.customerName || "-" })}
          </Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("delivery.confirmOrdered")}</Text>
            <Text style={styles.statValue}>{orderedQty}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("delivery.confirmDelivered")}</Text>
            <Text style={styles.statValue}>
              {deliveredQty != null ? deliveredQty : "—"}
            </Text>
          </View>
          <InputField
            label={t("delivery.confirmLoss")}
            value={lossText}
            onChangeText={setLossText}
            keyboardType="number-pad"
            error={fieldError}
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              disabled={submitting}
              onPress={onCancel}
            >
              <Text style={styles.btnTextSecondary}>{t("delivery.confirmCancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              disabled={submitting}
              onPress={handleConfirmPress}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.btnTextPrimary}>{t("delivery.confirmSubmit")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
