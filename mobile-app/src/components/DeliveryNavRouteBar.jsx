import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { formatRouteDistanceKm, formatRouteDurationMin } from "../utils/deliveryNavigation";

function DeliveryNavRouteBarInner({ routeSummary, activeNavOrder, topOffset = 0 }) {
  const { t } = useTranslation();
  const { colors, radii, shadows, spacing, typography } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          zIndex: 20,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          ...shadows.card,
        },
        eta: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        subtitle: {
          marginTop: 2,
          fontSize: typography.caption,
          color: colors.textSecondary,
        },
      }),
    [colors, radii, shadows, spacing, typography],
  );

  if (!routeSummary) return null;

  const km = formatRouteDistanceKm(routeSummary.distanceKm);
  const minutes = formatRouteDurationMin(routeSummary.durationMin);
  if (km == null || minutes == null) return null;

  const etaLine = t("delivery.routeEtaDistance", { minutes, km });
  const stopLine = activeNavOrder
    ? t("delivery.routeNextStop", {
        id: activeNavOrder.id,
        name: activeNavOrder.customerName || t("delivery.routeCustomerFallback"),
      })
    : null;

  return (
    <View style={[styles.bar, { top: topOffset }]}>
      <Text style={styles.eta}>{etaLine}</Text>
      {stopLine ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {stopLine}
        </Text>
      ) : null}
    </View>
  );
}

export const DeliveryNavRouteBar = React.memo(DeliveryNavRouteBarInner);
