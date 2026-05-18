import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import QrModal from "../components/QrModal";
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
  const { colors, radii, spacing, typography } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrValue, setQrValue] = useState("");

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
        },
        qtyBtn: {
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
        },
        qtyButtonText: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: 18,
        },
        qty: {
          minWidth: 28,
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
          minWidth: 140,
        },
      }),
    [colors, radii, spacing, typography],
  );

  async function handlePreOrder() {
    if (!items.length) {
      Alert.alert(t("cart.emptyAlertTitle"), t("cart.emptyAlertMessage"));
      return;
    }
    setSubmitting(true);
    try {
      const createdOrders = await preOrderCart(token, user, items);
      const orderIds = createdOrders.map((order) => order?.id).filter(Boolean);
      setQrValue(
        JSON.stringify({
          type: "PRE_ORDER",
          orderIds,
          createdAt: new Date().toISOString(),
        }),
      );
      setShowQr(true);
      clearCart();
      Alert.alert(t("cart.preOrderReadyTitle"), t("cart.preOrderReadyMessage"));
    } catch (error) {
      Alert.alert(t("cart.preOrderFailedTitle"), getApiErrorMessage(error, t("cart.preOrderFailedDefault")));
    } finally {
      setSubmitting(false);
    }
  }

  const subtitleKey = totalQty === 1 ? "cart.subtitle" : "cart.subtitle_plural";

  return (
    <Screen>
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
      <QrModal
        visible={showQr}
        qrValue={qrValue}
        onClose={() => {
          setShowQr(false);
          navigation.navigate("ItemListScreen");
        }}
      />
    </Screen>
  );
}
