import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QrModal from "../components/QrModal";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { AppIcon, Card, EmptyState, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { preOrderCart } from "../services/ordersApi";
import { colors, radii, spacing, typography } from "../theme";

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const { token, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrValue, setQrValue] = useState("");

  const totalQty = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [items],
  );

  async function handlePreOrder() {
    if (!items.length) {
      Alert.alert("Cart empty", "Please add items before pre-order");
      return;
    }
    setSubmitting(true);
    try {
      const createdOrders = await preOrderCart(token, user, items);
      const orderIds = createdOrders.map((order) => order?.id).filter(Boolean);
      setQrValue(JSON.stringify({
        type: "PRE_ORDER",
        orderIds,
        createdAt: new Date().toISOString(),
      }));
      setShowQr(true);
      clearCart();
      Alert.alert("Pre-order ready", "Your QR code is ready to be scanned.");
    } catch (error) {
      Alert.alert("Pre-order failed", getApiErrorMessage(error, "Unable to submit pre-order"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Screen style={styles.container}>
        <SectionHeader
          title="Your Cart"
          subtitle={`${totalQty} item${totalQty === 1 ? "" : "s"} selected`}
        />
        <FlatList
          data={items}
          contentContainerStyle={styles.list}
          keyExtractor={(entry) => String(entry.item.id)}
          renderItem={({ item: entry }) => (
            <Card style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{entry.item.name}</Text>
                <Text style={styles.sku}>SKU: {entry.item.sku || "-"}</Text>
              </View>
              <View style={styles.actions}>
                <View style={styles.qtyWrap}>
                  <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(entry.item.id, entry.quantity - 1)}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.qty}>{entry.quantity}</Text>
                  <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(entry.item.id, entry.quantity + 1)}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => removeItem(entry.item.id)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              title="Your cart is empty"
              subtitle="Add products from the catalog to start a pre-order."
            />
          }
        />
        <View style={styles.footer}>
          <Text style={styles.total}>Total Qty: {totalQty}</Text>
          <PrimaryButton
            title="Pre-Order"
            tone="success"
            onPress={handlePreOrder}
            loading={submitting}
            style={styles.preOrderButton}
            icon={<AppIcon name="qrcode" size={18} color="#fff" />}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
  },
  actions: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
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
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  list: {
    paddingBottom: spacing.md,
  },
  total: {
    fontWeight: "700",
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  preOrderButton: {
    minWidth: 130,
  },
});
