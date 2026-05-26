import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "./ui";
import { DeliveryRouteDirections } from "./DeliveryRouteDirections";
import { buildMapRegion, getOrderDestination } from "../utils/deliveryNavigation";
import { useTheme } from "../context/ThemeContext";

const DRIVER_FOLLOW_DELTA = 0.018;

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
  onRouteReady,
  fullScreen = false,
  bottomInset = 0,
  overlayTopInset = 0,
  mapWidth = 0,
  mapHeight = 0,
}) {
  const { t } = useTranslation();
  const { colors, radii, shadows, sizes, spacing, typography } = useTheme();
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
          height: sizes.mapEmbeddedHeight,
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
        recenterButton: {
          position: "absolute",
          right: spacing.lg,
          zIndex: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radii.pill,
          backgroundColor: colors.surface,
          ...shadows.card,
        },
        recenterLabel: {
          fontSize: typography.caption,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        map: {
          flex: 1,
          width: "100%",
          minHeight: sizes.mapMinHeight,
        },
      }),
    [colors, radii, shadows, sizes.mapEmbeddedHeight, sizes.mapMinHeight, spacing, typography],
  );
  const mapRef = useRef(null);
  const lastNavTargetKey = useRef(null);
  const lastFitRouteKey = useRef(null);
  const insets = useSafeAreaInsets();
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const [followDriver, setFollowDriver] = useState(true);

  const mapRegion = useMemo(
    () => buildMapRegion(driverLocation, activeDestination),
    [driverLocation, activeDestination],
  );

  const navTargetKey = useMemo(() => {
    const destKey = activeDestination
      ? `${activeDestination.latitude},${activeDestination.longitude}`
      : "none";
    return `${activeNavOrderId || ""}:${destKey}`;
  }, [activeNavOrderId, activeDestination]);

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

  const animateToDriver = useCallback(() => {
    if (!mapRef.current || !driverLocation) return;
    mapRef.current.animateToRegion(
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: DRIVER_FOLLOW_DELTA,
        longitudeDelta: DRIVER_FOLLOW_DELTA,
      },
      400,
    );
  }, [driverLocation]);

  const handleRouteReady = useCallback(
    (result) => {
      onRouteReady?.(result);
      if (navTargetKey !== lastFitRouteKey.current) {
        lastFitRouteKey.current = navTargetKey;
        fitRouteOnMap(result);
        setFollowDriver(false);
      }
    },
    [fitRouteOnMap, navTargetKey, onRouteReady],
  );

  useEffect(() => {
    if (navTargetKey === lastNavTargetKey.current) return;
    lastNavTargetKey.current = navTargetKey;
    lastFitRouteKey.current = null;
    if (!mapRef.current || !mapRegion) return;
    mapRef.current.animateToRegion(mapRegion, 450);
    setFollowDriver(true);
  }, [navTargetKey, mapRegion]);

  useEffect(() => {
    if (!fullScreen || !followDriver || !driverLocation) return undefined;
    animateToDriver();
    return undefined;
  }, [driverLocation, followDriver, fullScreen, animateToDriver]);

  const handleRecenter = useCallback(() => {
    setFollowDriver(true);
    if (driverLocation) {
      animateToDriver();
    } else if (mapRef.current && mapRegion) {
      mapRef.current.animateToRegion(mapRegion, 450);
    }
  }, [animateToDriver, driverLocation, mapRegion]);

  const handlePanDrag = useCallback(() => {
    setFollowDriver(false);
  }, []);

  const warnings = [];
  if (readyOrdersMissingCoordsCount > 0) {
    warnings.push(t("delivery.missingCoordsWarning", { count: readyOrdersMissingCoordsCount }));
  }
  if (showNoCoordsWarning) {
    warnings.push(t("delivery.directionsSetupHint"));
  }
  if (directionsError) {
    warnings.push(directionsError);
  }

  const showDriverMarker = !fullScreen && driverLocation;

  const mapMarkers = (
    <>
      {showDriverMarker ? (
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
          onReady={handleRouteReady}
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
            showsUserLocation
            showsMyLocationButton={false}
            toolbarEnabled={false}
            onPanDrag={handlePanDrag}
          >
            {mapMarkers}
          </MapView>
        ) : null}
        {warnings.length > 0 ? (
          <Text
            style={[
              styles.mapOverlayWarning,
              { top: overlayTopInset > 0 ? overlayTopInset : insets.top + 56 },
            ]}
            numberOfLines={2}
          >
            {warnings[0]}
          </Text>
        ) : null}
        <Pressable
          style={[
            styles.recenterButton,
            {
              bottom: Math.max(bottomInset + insets.bottom + spacing.md, spacing.xl),
            },
          ]}
          onPress={handleRecenter}
          accessibilityRole="button"
          accessibilityLabel={t("delivery.recenter")}
        >
          <AppIcon name="crosshairs-gps" size={20} color={colors.textPrimary} />
          <Text style={styles.recenterLabel}>{t("delivery.recenter")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.mapSection}>
      <Text style={styles.mapSectionTitle}>{t("delivery.mapTitle")}</Text>
      {activeNavOrder ? (
        <Text style={styles.mapSectionLead}>
          {t("delivery.mapNextStop", {
            id: activeNavOrder.id,
            name: activeNavOrder.customerName || t("delivery.routeCustomerFallback"),
          })}
        </Text>
      ) : (
        <Text style={styles.mapSectionLead}>{t("delivery.waitingForGps")}</Text>
      )}
      {warnings.map((msg) => (
        <Text key={msg} style={styles.mapWarning}>
          {msg}
        </Text>
      ))}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          onPanDrag={handlePanDrag}
        >
          {mapMarkers}
        </MapView>
      </View>
    </View>
  );
}

export const DeliveryMapSection = React.memo(DeliveryMapSectionInner);
