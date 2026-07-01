import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useDepotBatchCart } from "../context/DepotBatchCartContext";
import { useTheme } from "../context/ThemeContext";
import {
  AppIcon,
  Card,
  EmptyState,
  PrimaryButton,
  Screen,
  SectionHeader,
} from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { createDepotBatch } from "../services/ordersApi";
import { fetchCustomers } from "../services/customersApi";
import { fetchItems } from "../services/itemsApi";

export default function DepotBatchCartScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, radii, spacing, typography, sizes, borders } = theme;
  const insets = useSafeAreaInsets();
  const {
    cartByCustomer,
    totalLines,
    customerCount,
    updateLineQty,
    removeLine,
    clearCustomer,
    clearAll,
  } = useDepotBatchCart();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: { flex: 1 },
        list: { paddingBottom: spacing.sm },
        customerCard: { marginBottom: spacing.md },
        customerName: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        lineRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        lineName: {
          flex: 1,
          color: colors.textPrimary,
          fontWeight: "600",
          fontSize: typography.bodySmall,
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
          width: sizes.qtyButtonSm,
          height: sizes.qtyButtonSm,
          alignItems: "center",
          justifyContent: "center",
        },
        qtyButtonText: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: sizes.qtyTextSm,
        },
        qtyInput: {
          minWidth: sizes.qtyButton,
          textAlign: "center",
          fontWeight: "700",
          color: colors.textPrimary,
          paddingVertical: 0,
        },
        footer: {
          paddingTop: spacing.md,
          backgroundColor: colors.background,
          gap: spacing.sm,
          ...borders.dividerTop,
        },
        footerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        total: {
          fontWeight: "700",
          fontSize: typography.body,
          color: colors.textPrimary,
        },
        clearLink: {
          alignSelf: "flex-end",
          paddingVertical: spacing.xs,
        },
        clearLinkText: {
          color: colors.danger,
          fontSize: typography.caption,
          fontWeight: "600",
        },
        actions: {
          flexDirection: "row",
          gap: spacing.sm,
        },
        actionBtn: { flex: 1 },
      }),
    [borders, colors, radii, sizes, spacing, typography],
  );

  const loadMeta = useCallback(async () => {
    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!accessToken) return;
    try {
      const [customerRows, itemRows] = await Promise.all([
        fetchCustomers(accessToken),
        fetchItems(accessToken),
      ]);
      setCustomers(Array.isArray(customerRows) ? customerRows : []);
      setItems(Array.isArray(itemRows) ? itemRows : []);
    } catch {
      /* names fall back to ids */
    }
  }, [token]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const customersById = useMemo(() => {
    const map = new Map();
    for (const c of customers) map.set(String(c.id), c);
    return map;
  }, [customers]);

  const itemsById = useMemo(() => {
    const map = new Map();
    for (const item of items) map.set(String(item.id), item);
    return map;
  }, [items]);

  const cartEntries = useMemo(
    () =>
      Object.entries(cartByCustomer)
        .filter(([, lines]) => Array.isArray(lines) && lines.length > 0)
        .map(([customerId, lines]) => ({ customerId, lines })),
    [cartByCustomer],
  );

  async function handleSubmit() {
    const flattened = [];
    for (const [customerId, lines] of Object.entries(cartByCustomer)) {
      if (!Array.isArray(lines)) continue;
      for (const line of lines) {
        flattened.push({
          customerId: String(customerId),
          itemId: String(line.itemId),
          orderedQty: Number(line.orderedQty) || 1,
          currency: "KHR",
        });
      }
    }
    if (flattened.length === 0) {
      Alert.alert(t("depot.batchEmptyTitle"), t("depot.batchEmptyMessage"));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDepotBatch(token, flattened);
      const count = Array.isArray(created) ? created.length : flattened.length;
      Alert.alert(
        t("depot.batchSuccessTitle"),
        t("depot.batchSuccessDetail", { count, customers: customerCount }),
      );
      clearAll();
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t("depot.batchFailedTitle"),
        getApiErrorMessage(error, t("depot.batchFailedDefault")),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen busy={submitting} busyMessage={t("depot.submitBatch")}>
      <SectionHeader
        title={t("depot.cartTitle")}
        subtitle={t("depot.cartSubtitle", { lines: totalLines, customers: customerCount })}
        rightAction={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <AppIcon name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        }
      />

      <View style={styles.body}>
        <FlatList
          style={{ flex: 1 }}
          data={cartEntries}
          keyExtractor={(entry) => entry.customerId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState title={t("depot.cartEmptyTitle")} subtitle={t("depot.cartEmptySubtitle")} />
          }
          renderItem={({ item: entry }) => {
          const customer = customersById.get(String(entry.customerId));
          return (
            <Card style={styles.customerCard}>
              <Text style={styles.customerName}>
                {customer?.name || t("depot.unnamed")} · #{entry.customerId}
              </Text>
              {entry.lines.map((line) => {
                const product = itemsById.get(String(line.itemId));
                return (
                  <View key={String(line.itemId)} style={styles.lineRow}>
                    <Text style={styles.lineName} numberOfLines={2}>
                      {product?.name || `Item #${line.itemId}`}
                    </Text>
                    <View style={styles.qtyWrap}>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() =>
                          updateLineQty(entry.customerId, line.itemId, Number(line.orderedQty) - 1)
                        }
                      >
                        <Text style={styles.qtyButtonText}>-</Text>
                      </Pressable>
                      <TextInput
                        style={styles.qtyInput}
                        keyboardType="number-pad"
                        value={String(line.orderedQty)}
                        onChangeText={(text) =>
                          updateLineQty(
                            entry.customerId,
                            line.itemId,
                            text.replace(/[^0-9]/g, ""),
                          )
                        }
                      />
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() =>
                          updateLineQty(entry.customerId, line.itemId, Number(line.orderedQty) + 1)
                        }
                      >
                        <Text style={styles.qtyButtonText}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable onPress={() => removeLine(entry.customerId, line.itemId)} hitSlop={8}>
                      <AppIcon name="close" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
              <Pressable style={styles.clearLink} onPress={() => clearCustomer(entry.customerId)}>
                <Text style={styles.clearLinkText}>{t("depot.clearCustomer")}</Text>
              </Pressable>
            </Card>
          );
          }}
        />

        {totalLines > 0 ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.footerRow}>
              <Text style={styles.total}>{t("depot.total", { count: totalLines })}</Text>
            </View>
            <PrimaryButton
              title={t("depot.submitBatch")}
              tone="success"
              onPress={handleSubmit}
              loading={submitting}
              icon={<AppIcon name="check-circle-outline" size={18} color={colors.onPrimary} />}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
