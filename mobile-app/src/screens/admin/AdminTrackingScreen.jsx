import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, Screen } from "../../components/ui";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchAdminCustomers } from "../../services/adminApi/customers";
import { fetchOrderDeliveryLocation } from "../../services/adminApi/deliveryLocations";
import { fetchOrders } from "../../services/adminApi/orders";

function parseCoord(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function openMaps(lat, lng, label) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${label ? `&query_place_id=` : ""}`;
  const geo = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label || "Location")})`;
  Linking.openURL(geo).catch(() => Linking.openURL(url));
}

export default function AdminTrackingScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError } = useAlert();
  const { colors, spacing, typography, radii } = useTheme();
  const [tab, setTab] = useState("customers");
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [driverLocations, setDriverLocations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
        tab: {
          flex: 1,
          paddingVertical: spacing.sm,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceSoft,
          alignItems: "center",
        },
        tabActive: { backgroundColor: colors.primary },
        tabText: { fontWeight: "700", color: colors.textPrimary, fontSize: typography.bodySmall },
        tabTextActive: { color: colors.onPrimary },
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        link: { marginTop: spacing.sm, fontSize: typography.bodySmall, fontWeight: "700", color: colors.textSecondary },
      }),
    [colors, radii.pill, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [nextCustomers, nextOrders] = await Promise.all([
        fetchAdminCustomers(token),
        fetchOrders(token),
      ]);
      setCustomers(nextCustomers);
      setOrders(nextOrders);

      const ready = nextOrders.filter(
        (o) => (o.status || o.statusName) === "Ready_For_Delivery" && o.deliveryAgentId != null,
      );
      const byAgent = new Map();
      for (const order of ready) {
        const agentId = String(order.deliveryAgentId);
        if (!byAgent.has(agentId)) byAgent.set(agentId, order);
      }
      const locations = {};
      await Promise.all(
        [...byAgent.values()].map(async (order) => {
          try {
            const loc = await fetchOrderDeliveryLocation(token, order.id);
            if (loc) {
              locations[String(order.deliveryAgentId)] = {
                ...loc,
                agentName: order.deliveryAgentName,
                orderId: order.id,
              };
            }
          } catch (_err) {
            // ignore missing location per agent
          }
        }),
      );
      setDriverLocations(locations);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const customerMarkers = useMemo(() => {
    return customers
      .map((c) => {
        const lat = parseCoord(c.latitude);
        const lng = parseCoord(c.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { ...c, lat, lng };
      })
      .filter(Boolean);
  }, [customers]);

  const driverRows = useMemo(() => Object.entries(driverLocations).map(([agentId, loc]) => ({
    agentId,
    ...loc,
    lat: parseCoord(loc.lat ?? loc.latitude),
    lng: parseCoord(loc.lng ?? loc.longitude),
  })), [driverLocations]);

  const rows = tab === "customers" ? customerMarkers : driverRows;

  return (
    <Screen busy={loading && rows.length === 0}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "customers" && styles.tabActive]} onPress={() => setTab("customers")}>
          <Text style={[styles.tabText, tab === "customers" && styles.tabTextActive]}>
            {t("admin.tracking.customers")}
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "drivers" && styles.tabActive]} onPress={() => setTab("drivers")}>
          <Text style={[styles.tabText, tab === "drivers" && styles.tabTextActive]}>
            {t("admin.tracking.drivers")}
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id || item.agentId || item.orderId)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.tracking.empty")} /> : null}
        renderItem={({ item }) => {
          const lat = item.lat;
          const lng = item.lng;
          const label = item.name || item.agentName || "Location";
          return (
            <Card style={styles.card}>
              <Text style={styles.title}>{label}</Text>
              <Text style={styles.meta}>
                {Number.isFinite(lat) && Number.isFinite(lng)
                  ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                  : t("admin.tracking.noCoords")}
              </Text>
              {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
              {Number.isFinite(lat) && Number.isFinite(lng) ? (
                <Pressable
                  onPress={() => {
                    try {
                      openMaps(lat, lng, label);
                    } catch (_err) {
                      showError(t("admin.tracking.openFailed"), t("admin.tracking.openFailed"));
                    }
                  }}
                >
                  <Text style={styles.link}>{t("admin.tracking.openMaps")}</Text>
                </Pressable>
              ) : null}
            </Card>
          );
        }}
      />
    </Screen>
  );
}
