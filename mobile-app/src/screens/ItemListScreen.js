import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { AppIcon, Card, EmptyState, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { fetchItems } from "../services/itemsApi";
import { getApiErrorMessage } from "../services/apiClient";
import { colors, radii, spacing, typography } from "../theme";

const headerCartStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
});

function CartHeaderButton({ navigation, totalItems }) {
  return (
    <Pressable style={headerCartStyles.badge} onPress={() => navigation.navigate("Cart")}>
      <AppIcon name="cart-outline" size={18} color={colors.textPrimary} />
      <Text style={headerCartStyles.badgeText}>Cart {totalItems}</Text>
    </Pressable>
  );
}

export default function ItemListScreen({ navigation }) {
  const { token } = useAuth();
  const { addItem, totalItems } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      const data = await fetchItems(token);
      setItems(data);
      setLoadError("");
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to fetch items");
      setLoadError(message);
      Alert.alert("Sync failed", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const headerRight = useCallback(
    () => <CartHeaderButton navigation={navigation} totalItems={totalItems} />,
    [navigation, totalItems],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight });
  }, [navigation, headerRight]);

  function onRefresh() {
    setRefreshing(true);
    loadItems();
  }

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading catalog...</Text>
      </Screen>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Screen style={styles.container}>
        <SectionHeader
          title="Product Catalog"
          subtitle="Browse available products and add to your cart"
        />
        {!!loadError && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load latest products</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <PrimaryButton
              title="Try Again"
              onPress={loadItems}
              style={styles.retryButton}
              icon={<AppIcon name="refresh" size={18} color="#fff" />}
            />
          </Card>
        )}
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSku}>SKU: {item.sku || "-"}</Text>
              <PrimaryButton
                title="Add to Cart"
                onPress={() => {
                  addItem(item);
                  Alert.alert("Added to cart", `${item.name} has been added to your cart.`);
                }}
                style={styles.addButton}
                icon={<AppIcon name="cart-plus" size={18} color="#fff" />}
              />
            </Card>
          )}
          ListEmptyComponent={<EmptyState title="No products available" subtitle="Pull down to refresh the catalog." />}
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
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  addButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    minWidth: 124,
  },
});
