import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { AppIcon, Card, EmptyState, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { preOrderCart } from "../services/ordersApi";
import { useOrderPlacementGate } from "../hooks/useOrderPlacementGate";
import { navigateToOrderPayment } from "../utils/orderPlacementGate";

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess, showWarning } = useAlert();
  const insets = useSafeAreaInsets();
  const { colors, radii, sizes, spacing, typography, borders } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const { blockerOrder, canPlaceOrder } = useOrderPlacementGate();

  function showUnpaidReceivedAlert(order) {
    showWarning(t("cart.unpaidReceivedBlockTitle"), t("cart.unpaidReceivedBlockMessage", { id: order?.id }), {
      actions: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("cart.unpaidReceivedPayNow"),
          onPress: () => navigateToOrderPayment(navigation, order),
        },
      ],
    });
  }

  function closeSuccessAndGoBack() {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  }

  function goToMyOrders() {
    navigation.getParent()?.navigate("MyOrders");
  }

  const totalQty = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [items],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          ...borders.panel,
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
        preOrderButtonBlocked: {
          opacity: 0.5,
        },
        blockNotice: {
          marginBottom: spacing.md,
          backgroundColor: colors.warningSoft,
        },
        blockNoticeText: {
          color: colors.textSecondary,
          fontSize: typography.bodySmall,
          lineHeight: 20,
        },
        blockNoticeLink: {
          marginTop: spacing.sm,
          color: colors.primary,
          fontWeight: "700",
          fontSize: typography.bodySmall,
        },
      }),
    [borders, colors, radii, sizes, spacing, typography],
  );

  async function handlePreOrder() {
    if (!items.length) {
      showWarning(t("cart.emptyAlertTitle"), t("cart.emptyAlertMessage"));
      return;
    }
    if (blockerOrder) {
      showUnpaidReceivedAlert(blockerOrder);
      return;
    }
    setSubmitting(true);
    try {
      await preOrderCart(token, user, items);
      await clearCart();
      showSuccess(t("cart.preOrderReadyTitle"), "", {
        dismissible: false,
        actions: [
          { text: t("cart.viewMyOrders"), onPress: goToMyOrders },
          { text: t("cart.continueShopping"), style: "soft", onPress: closeSuccessAndGoBack },
        ],
      });
    } catch (error) {
      showError(
        t("cart.preOrderFailedTitle"),
        getApiErrorMessage(error, t("cart.preOrderFailedDefault")),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const subtitleKey = totalQty === 1 ? "cart.subtitle" : "cart.subtitle_plural";

  return (
    <Screen busy={submitting} busyMessage={t("cart.preOrder")}>
      <SectionHeader title={t("cart.title")} subtitle={t(subtitleKey, { count: totalQty })} />
      {blockerOrder ? (
        <Card style={styles.blockNotice}>
          <Text style={styles.blockNoticeText}>{t("cart.unpaidReceivedBanner")}</Text>
          <Pressable onPress={() => showUnpaidReceivedAlert(blockerOrder)}>
            <Text style={styles.blockNoticeLink}>{t("cart.unpaidReceivedPayNow")}</Text>
          </Pressable>
        </Card>
      ) : null}
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
                  accessibilityRole="button"
                  accessibilityLabel={t("cart.decreaseQty", { name: entry.item.name })}
                >
                  <Text style={styles.qtyButtonText}>−</Text>
                </Pressable>
                <Text style={styles.qty} accessibilityLabel={String(entry.quantity)}>
                  {entry.quantity}
                </Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(entry.item.id, entry.quantity + 1)}
                  accessibilityRole="button"
                  accessibilityLabel={t("cart.increaseQty", { name: entry.item.name })}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => removeItem(entry.item.id)}
                accessibilityRole="button"
                accessibilityLabel={t("cart.removeItem", { name: entry.item.name })}
              >
                <Text style={styles.remove}>{t("cart.remove")}</Text>
              </Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title={t("cart.emptyTitle")} subtitle={t("cart.emptySubtitle")} icon="cart-outline" />
        }
      />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Text style={styles.total}>{t("cart.total", { count: totalQty })}</Text>
        <PrimaryButton
          title={t("cart.preOrder")}
          tone="success"
          onPress={handlePreOrder}
          loading={submitting}
          disabled={!canPlaceOrder}
          style={[styles.preOrderButton, !canPlaceOrder ? styles.preOrderButtonBlocked : null]}
          icon={<AppIcon name="qrcode" size={18} color={colors.onPrimary} />}
        />
      </View>
    </Screen>
  );
}
