import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import {
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
import { useAuth } from "../context/AuthContext";
import { useDepotBatchCart } from "../context/DepotBatchCartContext";
import { useTheme } from "../context/ThemeContext";
import {
  AppIcon,
  Card,
  DepotCustomerCardSkeleton,
  EmptyState,
  PrimaryButton,
  Screen,
  SectionHeader,
  SkeletonList,
} from "../components/ui";
import { fetchCustomers } from "../services/customersApi";
import { fetchItems } from "../services/itemsApi";
import { getApiErrorMessage } from "../services/apiClient";
function createStyles({ colors, radii, spacing, typography, sizes, layout }) {
  return StyleSheet.create({
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
      minWidth: sizes.modalButtonMinWidth,
    },
    list: {
      paddingBottom: spacing.md,
    },
    customerRow: {
      marginBottom: spacing.sm,
    },
    customerRowInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    customerName: {
      fontSize: typography.body,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    customerMeta: {
      marginTop: 2,
      color: colors.textSecondary,
      fontSize: typography.bodySmall,
    },
    cartHeaderBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    cartHeaderBtnText: {
      color: colors.textPrimary,
      fontSize: typography.bodySmall,
      fontWeight: "600",
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
      width: "100%",
      maxWidth: layout.isTablet ? layout.contentMaxWidth : undefined,
      alignSelf: layout.isTablet ? "center" : undefined,
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
}

/**
 * Depot operator builds a batch: per customer, choose item(s) and qty, then submit.
 * Each customer becomes a mini-cart inside the same screen; on submit the
 * carts are flattened to one `{ lines: [...] }` payload sent to /orders/depot-batch.
 */
export default function PrepareDepotBatchScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, sizes } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const listPaddingBottom = sizes.tabBarOffset;
  const {
    cartByCustomer,
    totalLines: cartTotalLines,
    addLine,
  } = useDepotBatchCart();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

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
      const message = getApiErrorMessage(error, t("depot.loadDataFailed"));
      setLoadError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    void load();
  }

  function openDepotCart() {
    navigation.navigate("DepotBatchCart");
  }

  return (
    <Screen busy={loading && customers.length === 0}>
        <SectionHeader
          title={t("depot.prepareTitle")}
          rightAction={
            <Pressable style={styles.cartHeaderBtn} onPress={openDepotCart}>
              <AppIcon name="cart-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.cartHeaderBtnText}>{t("depot.openCart")}</Text>
              {cartTotalLines > 0 ? (
                <View
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: "700" }}>
                    {cartTotalLines > 99 ? "99+" : cartTotalLines}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          }
        />

        {loading ? <SkeletonList count={3} ItemComponent={DepotCustomerCardSkeleton} /> : null}

        {!loading && !!loadError && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>{t("depot.loadErrorTitle")}</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <PrimaryButton
              title={t("common.tryAgain")}
              onPress={() => {
                setLoading(true);
                void load();
              }}
              style={styles.retryButton}
              icon={<AppIcon name="refresh" size={18} color={colors.onPrimary} />}
            />
          </Card>
        )}

        {!loading ? (
        <FlatList
          data={customers}
          keyExtractor={(customer) => String(customer.id)}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textMuted}
            />
          }
          renderItem={({ item: customer }) => (
            <CustomerListRow
              customer={customer}
              styles={styles}
              colors={colors}
              onPress={() => setPickerCustomerId(String(customer.id))}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={t("depot.noCustomersTitle")}
              subtitle={t("depot.noCustomersSubtitle")}
            />
          }
        />
        ) : null}

        <ItemPickerModal
          visible={!!pickerCustomerId}
          styles={styles}
          colors={colors}
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
  );
}

function CustomerListRow({ customer, styles, colors, onPress }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.customerRow}>
        <View style={styles.customerRowInner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{customer.name || t("depot.unnamed")}</Text>
            <Text style={styles.customerMeta}>
              {customer.phone ? customer.phone : t("depot.noPhone")}
            </Text>
          </View>
          <AppIcon name="chevron-right" size={22} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

function ItemPickerModal({ visible, items, alreadyChosenItemIds, onPick, onClose, styles, colors }) {
  const { t } = useTranslation();
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
            <Text style={styles.modalTitle}>{t("depot.pickItem")}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <AppIcon name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
          <TextInput
            placeholder={t("depot.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={styles.modalSearch}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          <ScrollView style={styles.modalList}>
            {filteredItems.length === 0 ? (
              <Text style={styles.modalEmpty}>{t("depot.noItemsMatch")}</Text>
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
                      <Text style={styles.modalRowBadge}>{t("depot.added")}</Text>
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
