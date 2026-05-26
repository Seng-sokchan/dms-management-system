import React, { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { AppIcon, Card, EmptyState, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { preOrderCart } from "../services/ordersApi";

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { colors, layout, radii, sizes, spacing, typography } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  function closeSuccessAndGoBack() {
    setShowSuccess(false);
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  }

  const totalQty = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [items],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          padding: spacing.lg,
          justifyContent: "center",
        },
        modalCard: {
          width: "100%",
          maxWidth: layout.modalMaxWidth,
          alignSelf: "center",
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
        },
        successIconWrap: {
          width: sizes.iconLg,
          height: sizes.iconLg,
          borderRadius: sizes.iconLg / 2,
          backgroundColor: colors.successSoft ?? colors.surfaceSoft,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        },
        modalTitle: {
          marginTop: spacing.md,
          textAlign: "center",
          fontSize: typography.h3,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        modalMessage: {
          marginTop: spacing.sm,
          textAlign: "center",
          fontSize: typography.body,
          color: colors.textSecondary,
        },
        modalActions: {
          marginTop: spacing.lg,
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.md,
        },
        info: {
          flex: 1,
          marginRight: spacing.md,
        },
        name: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        sku: {
          color: colors.textMuted,
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
        },
        actions: {
          alignItems: "center",
          gap: spacing.sm,
        },
        qtyWrap: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surfaceSoft,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.xs,
        },
        qtyBtn: {
          width: sizes.qtyButton,
          height: sizes.qtyButton,
          alignItems: "center",
          justifyContent: "center",
        },
        qtyButtonText: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: sizes.qtyText,
        },
        qty: {
          minWidth: sizes.qtyButtonSm,
          textAlign: "center",
          fontWeight: "700",
          color: colors.textPrimary,
        },
        remove: {
          color: colors.danger,
          fontSize: typography.bodySmall,
          fontWeight: "600",
        },
        footer: {
          marginTop: spacing.sm,
          paddingTop: spacing.md,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        list: {
          paddingBottom: spacing.md,
        },
        total: {
          fontWeight: "800",
          fontSize: typography.body,
          color: colors.textPrimary,
        },
        preOrderButton: {
          minWidth: sizes.buttonMinWidth,
        },
      }),
    [colors, layout.modalMaxWidth, radii, sizes, spacing, typography],
  );

  async function handlePreOrder() {
    if (!items.length) {
      Alert.alert(t("cart.emptyAlertTitle"), t("cart.emptyAlertMessage"));
      return;
    }
    setSubmitting(true);
    try {
      await preOrderCart(token, user, items);
      clearCart();
      setShowSuccess(true);
    } catch (error) {
      Alert.alert(t("cart.preOrderFailedTitle"), getApiErrorMessage(error, t("cart.preOrderFailedDefault")));
    } finally {
      setSubmitting(false);
    }
  }

  const subtitleKey = totalQty === 1 ? "cart.subtitle" : "cart.subtitle_plural";

  return (
    <Screen>
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowSuccess(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.successIconWrap}>
              <AppIcon name="check" size={26} color={colors.success ?? colors.primary} />
            </View>
            <Text style={styles.modalTitle}>{t("cart.preOrderReadyTitle")}</Text>
            <Text style={styles.modalMessage}>{t("cart.preOrderReadyMessage")}</Text>
            <View style={styles.modalActions}>
              <PrimaryButton title="OK" onPress={closeSuccessAndGoBack} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <SectionHeader title={t("cart.title")} subtitle={t(subtitleKey, { count: totalQty })} />
      <FlatList
        data={items}
        contentContainerStyle={styles.list}
        keyExtractor={(entry) => String(entry.item.id)}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: entry }) => (
          <Card style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{entry.item.name}</Text>
              <Text style={styles.sku}>
                {t("cart.sku", { sku: entry.item.sku || t("common.dash") })}
              </Text>
            </View>
            <View style={styles.actions}>
              <View style={styles.qtyWrap}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(entry.item.id, entry.quantity - 1)}
                >
                  <Text style={styles.qtyButtonText}>−</Text>
                </Pressable>
                <Text style={styles.qty}>{entry.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(entry.item.id, entry.quantity + 1)}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => removeItem(entry.item.id)}>
                <Text style={styles.remove}>{t("cart.remove")}</Text>
              </Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title={t("cart.emptyTitle")} subtitle={t("cart.emptySubtitle")} />
        }
      />
      <View style={styles.footer}>
        <Text style={styles.total}>{t("cart.total", { count: totalQty })}</Text>
        <PrimaryButton
          title={t("cart.preOrder")}
          tone="success"
          onPress={handlePreOrder}
          loading={submitting}
          style={styles.preOrderButton}
          icon={<AppIcon name="qrcode" size={18} color={colors.onPrimary} />}
        />
      </View>
    </Screen>
  );
}
