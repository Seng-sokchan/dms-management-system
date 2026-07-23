import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, PrimaryButton, Screen } from "../components/ui";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/apiClient";
import { fulfillSpecialDayDelivery } from "../services/specialDayApi";

export default function DeliverySpecialDayFulfillScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const { colors, spacing, typography, radii } = useTheme();
  const registration = route.params?.registration;
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.h3, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        label: {
          marginTop: spacing.lg,
          marginBottom: spacing.xs,
          fontSize: typography.caption,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
          backgroundColor: colors.surface,
        },
        actions: { marginTop: spacing.lg, gap: spacing.sm },
      }),
    [colors, spacing, typography, radii],
  );

  async function handleSubmit() {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      showError(t("specialDay.quantityRequired"));
      return;
    }
    if (!registration?.id) return;
    setBusy(true);
    try {
      await fulfillSpecialDayDelivery(token, {
        registrationId: Number(registration.id),
        quantity: qty,
      });
      showSuccess(t("specialDay.fulfillOk"));
      navigation.popToTop();
    } catch (err) {
      showError(getApiErrorMessage(err, t("specialDay.fulfillError")));
    } finally {
      setBusy(false);
    }
  }

  if (!registration) {
    return (
      <Screen>
        <Text style={styles.meta}>{t("specialDay.loadError")}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <Text style={styles.title}>{registration.customerName || registration.depotName}</Text>
        <Text style={styles.meta}>
          {registration.specialDayName} · {registration.itemName || "—"}
        </Text>
        <Text style={styles.meta}>
          {t("specialDay.deliveredShort")}: {registration.deliveredQtyTotal || 0}
        </Text>
      </Card>

      <Text style={styles.label}>{t("specialDay.deliveredQty")}</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
      />

      <View style={styles.actions}>
        <PrimaryButton
          title={t("specialDay.fulfillAction")}
          onPress={handleSubmit}
          disabled={busy}
        />
        <PrimaryButton
          title={t("common.cancel")}
          tone="soft"
          onPress={() => navigation.goBack()}
          disabled={busy}
        />
      </View>
    </Screen>
  );
}
