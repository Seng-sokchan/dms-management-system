import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { DeliveryRouteDirections } from "./DeliveryRouteDirections";
import { buildMapRegion, getOrderDestination } from "../utils/deliveryNavigation";
import { colors, radii, spacing, typography } from "../theme";

function DeliveryMapSectionInner({
  driverLocation,
  activeNavOrder,
  activeNavOrderId,
  activeDestination,
  directionsOrigin,
  directionsError,
  readyForDeliveryOrders,
  readyOrdersMissingCoordsCount,
  useFakeLocation,
  onDirectionsError,
}) {
  const mapRef = useRef(null);
  const lastNavTargetKey = useRef(null);

  const mapRegion = useMemo(
    () => buildMapRegion(driverLocation, activeDestination),
    [driverLocation, activeDestination],
  );

  const otherStops = useMemo(
    () =>
      readyForDeliveryOrders
        .filter((order) => String(order.id) !== String(activeNavOrderId))
        .map((order) => ({
          id: order.id,
          dest: getOrderDestination(order),
          name: order.customerName,
        }))
        .filter((row) => row.dest),
    [readyForDeliveryOrders, activeNavOrderId],
  );

  const showNoCoordsWarning = !activeDestination && readyForDeliveryOrders.length > 0;

  const fitRouteOnMap = useCallback((result) => {
    const coords = result?.coordinates;
    if (!mapRef.current || !Array.isArray(coords) || coords.length === 0) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 56, right: 56, bottom: 56, left: 56 },
      animated: true,
    });
  }, []);

  useEffect(() => {
    const destKey = activeDestination
      ? `${activeDestination.latitude},${activeDestination.longitude}`
      : "none";
    const navKey = `${activeNavOrderId || ""}:${destKey}`;
    if (navKey === lastNavTargetKey.current) return;
    lastNavTargetKey.current = navKey;
    if (!mapRef.current || !mapRegion) return;
    mapRef.current.animateToRegion(mapRegion, 450);
  }, [activeNavOrderId, activeDestination, mapRegion]);

  return (
    <View style={styles.mapSection}>
      <Text style={styles.mapSectionTitle}>Navigation</Text>
      {activeNavOrder ? (
        <Text style={styles.mapSectionLead}>
          Next stop: #{activeNavOrder.id} — {activeNavOrder.customerName || "Customer"}
        </Text>
      ) : (
        <Text style={styles.mapSectionLead}>
          {useFakeLocation ? "Using test location…" : "Waiting for GPS to find the nearest stop…"}
        </Text>
      )}
      {useFakeLocation ? (
        <Text style={styles.fakeLocationBadge}>
          Test GPS enabled — set USE_FAKE_DRIVER_LOCATION to false in appConfig.js for real GPS.
        </Text>
      ) : null}
      {readyOrdersMissingCoordsCount > 0 ? (
        <Text style={styles.mapWarning}>
          {readyOrdersMissingCoordsCount} ready order(s) have no customer coordinates and are skipped.
        </Text>
      ) : null}
      {showNoCoordsWarning ? (
        <Text style={styles.mapWarning}>
          Set customer latitude and longitude in admin to show directions.
        </Text>
      ) : null}
      {directionsError ? <Text style={styles.mapWarning}>{directionsError}</Text> : null}
      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={styles.map} initialRegion={mapRegion}>
          {driverLocation ? (
            <Marker
              coordinate={driverLocation}
              pinColor="#2563eb"
              title="You"
              description="Your location"
            />
          ) : null}
          {activeDestination ? (
            <Marker
              coordinate={activeDestination}
              pinColor="#dc2626"
              title={activeNavOrder?.customerName || "Delivery"}
              description="Next stop"
            />
          ) : null}
          {otherStops.map((stop) => (
            <Marker
              key={String(stop.id)}
              coordinate={stop.dest}
              pinColor="#94a3b8"
              title={`#${stop.id}`}
              description={stop.name || "Other stop"}
              opacity={0.85}
            />
          ))}
          {directionsOrigin && activeDestination ? (
            <DeliveryRouteDirections
              origin={directionsOrigin}
              destination={activeDestination}
              onReady={fitRouteOnMap}
              onError={onDirectionsError}
            />
          ) : null}
        </MapView>
      </View>
    </View>
  );
}

export const DeliveryMapSection = React.memo(DeliveryMapSectionInner);

const styles = StyleSheet.create({
  mapSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  mapSectionTitle: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  mapSectionLead: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },
  mapWarning: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    color: colors.danger || "#dc2626",
  },
  fakeLocationBadge: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    color: colors.success,
  },
  mapWrap: {
    marginTop: spacing.sm,
    height: 260,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
});
