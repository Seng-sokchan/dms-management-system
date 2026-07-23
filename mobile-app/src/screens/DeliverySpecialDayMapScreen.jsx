import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, PrimaryButton } from "../components/ui";
import { DeliveryMapSection } from "../components/DeliveryMapSection";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useDeliveryLiveTracking } from "../hooks/useDeliveryLiveTracking";
import { parseCoord, shouldRefreshByDistance } from "../utils/deliveryNavigation";

const DIRECTIONS_ORIGIN_REFRESH_M = 500;
const DIRECTIONS_DEBOUNCE_MS = 400;
const BOTTOM_PANEL_HEIGHT = 168;

function stopLabel(row, t) {
  return row?.customerName || row?.depotName || t("specialDay.unknownTarget");
}

function getStopDestination(registration) {
  const latitude = parseCoord(registration?.customerLat);
  const longitude = parseCoord(registration?.customerLng);
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

export default function DeliverySpecialDayMapScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, radii, shadows, spacing, typography } = useTheme();
  const registration = route.params?.registration;

  const [directionsOrigin, setDirectionsOrigin] = useState(null);
  const [directionsError, setDirectionsError] = useState("");
  const [mapLayout, setMapLayout] = useState({ width: 0, height: 0 });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
          overflow: "hidden",
        },
        backButton: {
          position: "absolute",
          left: spacing.lg,
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
        backLabel: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        panel: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          ...shadows.card,
        },
        title: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        meta: {
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
          color: colors.textMuted,
        },
        noCoords: {
          marginTop: spacing.sm,
          fontSize: typography.caption,
          color: colors.danger,
        },
        actions: {
          marginTop: spacing.md,
        },
      }),
    [colors, radii, shadows, spacing, typography],
  );

  const destination = useMemo(() => getStopDestination(registration), [registration]);
  const bottomInset = BOTTOM_PANEL_HEIGHT + Math.max(insets.bottom, spacing.md);

  const { driverLocation } = useDeliveryLiveTracking({
    token,
    shouldTrack: isFocused,
    mapVisible: true,
  });

  useEffect(() => {
    setDirectionsError("");
    if (!destination) {
      setDirectionsOrigin(null);
      return;
    }
    if (!directionsOrigin && driverLocation) {
      setDirectionsOrigin(driverLocation);
    }
  }, [destination, driverLocation, directionsOrigin]);

  useEffect(() => {
    if (!driverLocation || !destination || !directionsOrigin) return undefined;
    if (!shouldRefreshByDistance(directionsOrigin, driverLocation, DIRECTIONS_ORIGIN_REFRESH_M)) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setDirectionsOrigin(driverLocation);
    }, DIRECTIONS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [driverLocation, destination, directionsOrigin]);

  const handleRecordDelivery = useCallback(() => {
    if (!registration) return;
    navigation.navigate("DeliverySpecialDayFulfill", {
      registration: {
        ...registration,
        assignmentStatus: "accepted",
      },
    });
  }, [navigation, registration]);

  if (!registration) {
    return (
      <View style={styles.root}>
        <Text style={[styles.meta, { padding: spacing.lg }]}>{t("specialDay.loadError")}</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setMapLayout({ width, height });
      }}
    >
      <DeliveryMapSection
        fullScreen
        hideHeader
        driverLocation={driverLocation}
        activeNavOrder={registration}
        activeNavOrderId={registration.id}
        activeDestination={destination}
        directionsOrigin={directionsOrigin}
        directionsError={directionsError}
        onDirectionsError={setDirectionsError}
        readyForDeliveryOrders={[]}
        bottomInset={bottomInset}
        overlayTopInset={insets.top + 52}
        mapWidth={mapLayout.width}
        mapHeight={mapLayout.height}
        destinationTitle={stopLabel(registration, t)}
        destinationDescription={registration.specialDayName || t("nav.specialDay")}
      />

      <Pressable
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t("delivery.back")}
      >
        <AppIcon name="arrow-left" size={18} color={colors.textPrimary} />
        <Text style={styles.backLabel}>{t("delivery.back")}</Text>
      </Pressable>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Text style={styles.title}>{stopLabel(registration, t)}</Text>
        <Text style={styles.meta}>
          {registration.specialDayName} · {registration.itemName || "—"}
        </Text>
        <Text style={styles.meta}>
          {registration.provinceName || t("specialDay.unspecifiedProvince")}
        </Text>
        {!destination ? (
          <Text style={styles.noCoords}>{t("specialDay.noStopCoords")}</Text>
        ) : null}
        <View style={styles.actions}>
          <PrimaryButton title={t("specialDay.fulfillAction")} onPress={handleRecordDelivery} />
        </View>
      </View>
    </View>
  );
}
