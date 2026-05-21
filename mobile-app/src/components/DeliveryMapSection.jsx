import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeliveryRouteDirections } from "./DeliveryRouteDirections";
import { buildMapRegion, getOrderDestination } from "../utils/deliveryNavigation";
import { useTheme } from "../context/ThemeContext";

function DeliveryMapSectionInner({
  driverLocation,
  activeNavOrder,
  activeNavOrderId,
  activeDestination,
  directionsOrigin,
  directionsError,
  readyForDeliveryOrders,
  readyOrdersMissingCoordsCount,
  onDirectionsError,
  fullScreen = false,
  bottomInset = 0,
  mapWidth = 0,
  mapHeight = 0,
}) {
  const { colors, radii, shadows, spacing, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fullscreenRoot: {
          flex: 1,
          width: "100%",
          backgroundColor: colors.surfaceMuted,
        },
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
          color: colors.danger,
        },
        mapWrap: {
          marginTop: spacing.sm,
          height: 260,
          borderRadius: radii.xl,
          overflow: "hidden",
          backgroundColor: colors.surface,
          ...shadows.card,
        },
        mapOverlayWarning: {
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          zIndex: 2,
          fontSize: typography.caption,
          color: colors.danger,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radii.sm,
          overflow: "hidden",
        },
        map: {
          flex: 1,
          width: "100%",
          minHeight: 220,
        },
      }),
    [colors, radii, shadows, spacing, typography],
  );
  const mapRef = useRef(null);
  const lastNavTargetKey = useRef(null);
  const insets = useSafeAreaInsets();
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });

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

  const fitRouteOnMap = useCallback(
    (result) => {
      const coords = result?.coordinates;
      if (!mapRef.current || !Array.isArray(coords) || coords.length === 0) return;
      const bottomPad = fullScreen ? Math.max(bottomInset + insets.bottom + 16, 72) : 56;
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: {
          top: fullScreen ? insets.top + 64 : 56,
          right: 40,
          bottom: bottomPad,
          left: 40,
        },
        animated: true,
      });
    },
    [bottomInset, fullScreen, insets.bottom, insets.top],
  );

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

  const warnings = [];
  if (readyOrdersMissingCoordsCount > 0) {
    warnings.push(`${readyOrdersMissingCoordsCount} order(s) missing coordinates.`);
  }
  if (showNoCoordsWarning) {
    warnings.push("Add customer lat/lng in admin for directions.");
  }
  if (directionsError) {
    warnings.push(directionsError);
  }

  const mapMarkers = (
    <>
      {driverLocation ? (
        <Marker
          coordinate={driverLocation}
          pinColor="#111111"
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
    </>
  );

  const handleLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayoutSize({ width, height });
    }
  }, []);

  const resolvedWidth = mapWidth > 0 ? mapWidth : layoutSize.width;
  const resolvedHeight = mapHeight > 0 ? mapHeight : layoutSize.height;
  const canRenderMap = resolvedWidth > 0 && resolvedHeight > 0;

  if (fullScreen) {
    return (
      <View style={styles.fullscreenRoot} onLayout={handleLayout}>
        {canRenderMap ? (
          <MapView
            ref={mapRef}
            style={{ width: resolvedWidth, height: resolvedHeight }}
            initialRegion={mapRegion}
            loadingEnabled
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
          >
            {mapMarkers}
          </MapView>
        ) : null}
        {warnings.length > 0 ? (
          <Text
            style={[styles.mapOverlayWarning, { top: insets.top + 56 }]}
            numberOfLines={2}
          >
            {warnings[0]}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.mapSection}>
      <Text style={styles.mapSectionTitle}>Navigation</Text>
      {activeNavOrder ? (
        <Text style={styles.mapSectionLead}>
          Next stop: #{activeNavOrder.id} — {activeNavOrder.customerName || "Customer"}
        </Text>
      ) : (
        <Text style={styles.mapSectionLead}>
          Waiting for GPS to find the nearest stop…
        </Text>
      )}
      {warnings.map((msg) => (
        <Text key={msg} style={styles.mapWarning}>
          {msg}
        </Text>
      ))}
      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={styles.map} initialRegion={mapRegion}>
          {mapMarkers}
        </MapView>
      </View>
    </View>
  );
}

export const DeliveryMapSection = React.memo(DeliveryMapSectionInner);
