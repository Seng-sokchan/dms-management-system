import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import {
  AppIcon,
  Card,
  CatalogCardSkeleton,
  EmptyState,
  PrimaryButton,
  Screen,
  SectionHeader,
  SkeletonList,
} from "../components/ui";
import { fetchItems } from "../services/itemsApi";
import { getApiErrorMessage } from "../services/apiClient";

function CartHeaderButton({ navigation, totalItems, styles }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Pressable style={styles.badge} onPress={() => navigation.navigate("Cart")}>
      <AppIcon name="cart-outline" size={18} color={colors.textPrimary} />
      <Text style={styles.badgeText}>{t("catalog.cartBadge", { count: totalItems })}</Text>
    </Pressable>
  );
}

export default function ItemListScreen({ navigation }) {
  const { token } = useAuth();
  const { addItem, totalItems } = useCart();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: colors.surfaceSoft,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        badgeText: {
          color: colors.textPrimary,
          fontSize: typography.bodySmall,
          fontWeight: "700",
        },
        errorCard: {
          marginBottom: spacing.md,
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
        },
        list: {
          paddingBottom: spacing.xxl,
        },
        card: {
          marginBottom: spacing.md,
        },
        itemName: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        itemSku: {
          marginTop: spacing.xs,
          color: colors.textMuted,
          fontSize: typography.bodySmall,
        },
        addButton: {
          marginTop: spacing.md,
          alignSelf: "flex-start",
        },
      }),
    [colors, radii, spacing, typography],
  );

  const loadItems = useCallback(async () => {
    try {
      const data = await fetchItems(token);
      setItems(data);
      setLoadError("");
    } catch (error) {
      const message = getApiErrorMessage(error, t("catalog.fetchFailed"));
      setLoadError(message);
      Alert.alert(t("catalog.syncFailed"), message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function onRefresh() {
    setRefreshing(true);
    loadItems();
  }

  return (
    <Screen busy={loading && items.length === 0} busyMessage={t("catalog.loading")}>
      <SectionHeader
        title={t("catalog.title")}
        subtitle={t("catalog.subtitle")}
        rightAction={<CartHeaderButton navigation={navigation} totalItems={totalItems} styles={styles} />}
      />
      {loading ? (
        <SkeletonList count={4} ItemComponent={CatalogCardSkeleton} />
      ) : null}
      {!loading && !!loadError && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t("catalog.loadErrorTitle")}</Text>
          <Text style={styles.errorBody}>{loadError}</Text>
          <PrimaryButton
            title={t("catalog.tryAgain")}
            onPress={loadItems}
            style={styles.retryButton}
            icon={<AppIcon name="refresh" size={18} color={colors.onPrimary} />}
          />
        </Card>
      )}
      {!loading ? (
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>{t("catalog.sku", { sku: item.sku || t("common.dash") })}</Text>
            <PrimaryButton
              title={t("catalog.addToCart")}
              onPress={() => addItem(item)}
              style={styles.addButton}
              icon={<AppIcon name="cart-plus" size={18} color={colors.onPrimary} />}
            />
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title={t("catalog.emptyTitle")} subtitle={t("catalog.emptySubtitle")} />
        }
      />
      ) : null}
    </Screen>
  );
}
