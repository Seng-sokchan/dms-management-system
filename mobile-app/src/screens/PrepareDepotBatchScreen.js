import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { AppIcon, Card, EmptyState, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { fetchCustomers } from "../services/customersApi";
import { fetchItems } from "../services/itemsApi";
import { createDepotBatch } from "../services/ordersApi";
import { getApiErrorMessage } from "../services/apiClient";
import { colors, radii, spacing, typography } from "../theme";

/**
 * Depot operator builds a batch: per customer, choose item(s) and qty, then submit.
 * Each customer becomes a mini-cart inside the same screen; on submit the
 * carts are flattened to one `{ lines: [...] }` payload sent to /orders/depot-batch.
 */
export default function PrepareDepotBatchScreen() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Map<customerId, Array<{ itemId, orderedQty }>> */
  const [cartByCustomer, setCartByCustomer] = useState({});

  /** Modal state for picking an item to add to a particular customer's cart */
  const [pickerCustomerId, setPickerCustomerId] = useState("");

  const load = useCallback(async () => {
    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!accessToken) return;
    try {
      const [customerRows, itemRows] = await Promise.all([
        fetchCustomers(accessToken),
        fetchItems(accessToken),
      ]);
      setCustomers(Array.isArray(customerRows) ? customerRows : []);
      setItems(Array.isArray(itemRows) ? itemRows : []);
      setLoadError("");
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to load depot data");
      setLoadError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    void load();
  }

  const itemsById = useMemo(() => {
    const map = new Map();
    for (const item of items) map.set(String(item.id), item);
    return map;
  }, [items]);

  const customersWithCart = useMemo(
    () =>
      customers.filter(
        (customer) => (cartByCustomer[String(customer.id)] || []).length > 0,
      ),
    [customers, cartByCustomer],
  );

  const totalLines = useMemo(
    () =>
      Object.values(cartByCustomer).reduce(
        (acc, lines) => acc + (Array.isArray(lines) ? lines.length : 0),
        0,
      ),
    [cartByCustomer],
  );

  function addLine(customerId, itemId) {
    setCartByCustomer((prev) => {
      const key = String(customerId);
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      if (existing.some((row) => String(row.itemId) === String(itemId))) {
        return prev;
      }
      return {
        ...prev,
        [key]: [...existing, { itemId: String(itemId), orderedQty: 1 }],
      };
    });
  }

  function updateLineQty(customerId, itemId, nextQty) {
    setCartByCustomer((prev) => {
      const key = String(customerId);
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      const cleaned = existing.map((row) =>
        String(row.itemId) === String(itemId)
          ? { ...row, orderedQty: Math.max(1, Number(nextQty) || 1) }
          : row,
      );
      return { ...prev, [key]: cleaned };
    });
  }

  function removeLine(customerId, itemId) {
    setCartByCustomer((prev) => {
      const key = String(customerId);
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      const filtered = existing.filter((row) => String(row.itemId) !== String(itemId));
      const next = { ...prev };
      if (filtered.length === 0) delete next[key];
      else next[key] = filtered;
      return next;
    });
  }

  function clearCart(customerId) {
    setCartByCustomer((prev) => {
      const next = { ...prev };
      delete next[String(customerId)];
      return next;
    });
  }

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
      Alert.alert("Batch empty", "Add at least one line before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDepotBatch(token, flattened);
      const count = Array.isArray(created) ? created.length : flattened.length;
      Alert.alert(
        "Batch submitted",
        `${count} order${count === 1 ? "" : "s"} created across ${customersWithCart.length} customer${customersWithCart.length === 1 ? "" : "s"}.`,
      );
      setCartByCustomer({});
    } catch (error) {
      Alert.alert(
        "Batch failed",
        getApiErrorMessage(error, "Unable to submit batch"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading depot data...</Text>
      </Screen>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Screen style={styles.container}>
        <SectionHeader
          title="Prepare batch"
          subtitle={
            totalLines > 0
              ? `${totalLines} line${totalLines === 1 ? "" : "s"} across ${customersWithCart.length} customer${customersWithCart.length === 1 ? "" : "s"}`
              : "Pick a customer, add items, then submit one batch."
          }
        />

        {!!loadError && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load data</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <PrimaryButton
              title="Try Again"
              onPress={() => {
                setLoading(true);
                void load();
              }}
              style={styles.retryButton}
              icon={<AppIcon name="refresh" size={18} color="#fff" />}
            />
          </Card>
        )}

        <FlatList
          data={customers}
          keyExtractor={(customer) => String(customer.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: customer }) => (
            <CustomerCard
              customer={customer}
              lines={cartByCustomer[String(customer.id)] || []}
              itemsById={itemsById}
              onAddItem={() => setPickerCustomerId(String(customer.id))}
              onChangeQty={(itemId, qty) => updateLineQty(customer.id, itemId, qty)}
              onRemoveLine={(itemId) => removeLine(customer.id, itemId)}
              onClear={() => clearCart(customer.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No customers in your depot"
              subtitle="Ask an admin or owner to assign customers to your depot."
            />
          }
        />

        <View style={styles.footer}>
          <Text style={styles.total}>
            {totalLines} line{totalLines === 1 ? "" : "s"}
          </Text>
          <PrimaryButton
            title="Submit Batch"
            tone="success"
            onPress={handleSubmit}
            loading={submitting}
            disabled={totalLines === 0}
            style={styles.submitButton}
            icon={<AppIcon name="check-circle-outline" size={18} color="#fff" />}
          />
        </View>

        <ItemPickerModal
          visible={!!pickerCustomerId}
          items={items}
          alreadyChosenItemIds={
            new Set(
              (cartByCustomer[pickerCustomerId] || []).map((l) => String(l.itemId)),
            )
          }
          onPick={(itemId) => {
            addLine(pickerCustomerId, itemId);
            setPickerCustomerId("");
          }}
          onClose={() => setPickerCustomerId("")}
        />
      </Screen>
    </SafeAreaView>
  );
}

function CustomerCard({
  customer,
  lines,
  itemsById,
  onAddItem,
  onChangeQty,
  onRemoveLine,
  onClear,
}) {
  const hasLines = lines.length > 0;
  return (
    <Card style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName}>{customer.name || "Unnamed"}</Text>
          <Text style={styles.customerMeta}>
            {customer.phone ? customer.phone : "No phone"}
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={onAddItem}>
          <AppIcon name="plus" size={16} color={colors.textPrimary} />
          <Text style={styles.addBtnText}>Add item</Text>
        </Pressable>
      </View>

      {hasLines ? (
        <View style={styles.linesWrap}>
          {lines.map((line) => {
            const item = itemsById.get(String(line.itemId));
            return (
              <View key={String(line.itemId)} style={styles.lineRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>{item?.name || `Item #${line.itemId}`}</Text>
                  {!!item?.sku && <Text style={styles.lineSku}>SKU: {item.sku}</Text>}
                </View>
                <View style={styles.qtyWrap}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => onChangeQty(line.itemId, Number(line.orderedQty) - 1)}
                  >
                    <Text style={styles.qtyButtonText}>-</Text>
                  </Pressable>
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="number-pad"
                    value={String(line.orderedQty)}
                    onChangeText={(text) => onChangeQty(line.itemId, text.replace(/[^0-9]/g, ""))}
                  />
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => onChangeQty(line.itemId, Number(line.orderedQty) + 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => onRemoveLine(line.itemId)}
                  style={styles.removeLine}
                  hitSlop={8}
                >
                  <AppIcon name="close" size={16} color={colors.danger} />
                </Pressable>
              </View>
            );
          })}
          <Pressable style={styles.clearLink} onPress={onClear}>
            <Text style={styles.clearLinkText}>Clear customer</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.noLines}>No items added yet.</Text>
      )}
    </Card>
  );
}

function ItemPickerModal({ visible, items, alreadyChosenItemIds, onPick, onClose }) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.name || ""} ${item.sku || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pick an item</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <AppIcon name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
          <TextInput
            placeholder="Search by name or SKU"
            placeholderTextColor={colors.textMuted}
            style={styles.modalSearch}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          <ScrollView style={styles.modalList}>
            {filteredItems.length === 0 ? (
              <Text style={styles.modalEmpty}>No items match.</Text>
            ) : (
              filteredItems.map((item) => {
                const isAdded = alreadyChosenItemIds.has(String(item.id));
                return (
                  <Pressable
                    key={String(item.id)}
                    style={[styles.modalRow, isAdded && styles.modalRowDisabled]}
                    onPress={() => !isAdded && onPick(item.id)}
                    disabled={isAdded}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalRowName}>{item.name}</Text>
                      {!!item.sku && (
                        <Text style={styles.modalRowSku}>SKU: {item.sku}</Text>
                      )}
                    </View>
                    {isAdded ? (
                      <Text style={styles.modalRowBadge}>Added</Text>
                    ) : (
                      <AppIcon name="plus" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  errorCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: typography.body,
  },
  errorBody: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
  },
  retryButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    minWidth: 120,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  customerCard: {
    marginBottom: spacing.md,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  customerName: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  customerMeta: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: {
    color: colors.textPrimary,
    fontSize: typography.bodySmall,
    fontWeight: "600",
  },
  noLines: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: typography.bodySmall,
  },
  linesWrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lineName: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: typography.body,
  },
  lineSku: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    marginTop: 2,
  },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  qtyInput: {
    minWidth: 32,
    textAlign: "center",
    fontWeight: "700",
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  removeLine: {
    paddingHorizontal: spacing.xs,
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
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  total: {
    fontWeight: "700",
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  submitButton: {
    minWidth: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSearch: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalList: {
    flexGrow: 0,
  },
  modalEmpty: {
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  modalRowDisabled: {
    opacity: 0.5,
  },
  modalRowName: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: typography.body,
  },
  modalRowSku: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    marginTop: 2,
  },
  modalRowBadge: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "600",
  },
});
