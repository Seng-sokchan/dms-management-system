import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GOOGLE_MAPS_API_KEY } from "../config/appConfig";
import {
  buildEtaTimeWindow,
  estimateFromHaversine,
  formatDistanceKmLabel,
  formatEtaWindow,
} from "../utils/deliveryEta";
import {
  buildRouteSummaryFromDirections,
  fetchDrivingRoute,
  haversineMeters,
  shouldRefreshByDistance,
} from "../utils/deliveryNavigation";

const DIRECTIONS_ORIGIN_REFRESH_M = 500;
const DIRECTIONS_DEBOUNCE_MS = 400;
const TRACKABLE_STATUS = "Ready_For_Delivery";

/**
 * Route ETA + progress copy for customer/depot tracking watchers.
 */
export function useDeliveryRouteProgress({
  origin,
  destination,
  driverName,
  audience = "customer",
  customerName,
  orderStatus,
}) {
  const { t, i18n } = useTranslation();
  const [routeSummary, setRouteSummary] = useState(null);
  const [directionsError, setDirectionsError] = useState("");
  const [fetchOrigin, setFetchOrigin] = useState(null);
  const fetchOriginRef = useRef(null);
  const directionsDebounceRef = useRef(null);
  const fetchAbortRef = useRef(null);

  fetchOriginRef.current = fetchOrigin;

  const resolvedDriverName =
    (typeof driverName === "string" && driverName.trim()) || t("tracking.driver");

  const haversineEstimate = useMemo(() => {
    if (!origin?.latitude || !destination?.latitude) return null;
    const distanceM = haversineMeters(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );
    return estimateFromHaversine(distanceM);
  }, [origin, destination]);

  const effectiveSummary = useMemo(() => {
    if (routeSummary) return routeSummary;
    if (!directionsError || !haversineEstimate) return null;
    return {
      distanceKm: haversineEstimate.distanceKm,
      durationMin: haversineEstimate.durationMin,
      kmLabel: formatDistanceKmLabel(haversineEstimate.distanceKm),
      minutesLabel: String(Math.max(1, Math.round(haversineEstimate.durationMin))),
      isFallback: true,
    };
  }, [routeSummary, haversineEstimate, directionsError]);

  useEffect(() => {
    setRouteSummary(null);
    setDirectionsError("");
  }, [destination?.latitude, destination?.longitude, origin?.latitude, origin?.longitude]);

  useEffect(() => {
    if (!origin || !destination) {
      if (directionsDebounceRef.current) clearTimeout(directionsDebounceRef.current);
      directionsDebounceRef.current = null;
      setFetchOrigin(null);
      return;
    }
    setFetchOrigin(origin);
  }, [origin, destination]);

  useEffect(() => {
    if (!origin || !destination) return undefined;

    const prev = fetchOriginRef.current;
    if (!prev) return undefined;
    if (!shouldRefreshByDistance(prev, origin, DIRECTIONS_ORIGIN_REFRESH_M)) {
      return undefined;
    }

    if (directionsDebounceRef.current) clearTimeout(directionsDebounceRef.current);
    directionsDebounceRef.current = setTimeout(() => {
      directionsDebounceRef.current = null;
      setFetchOrigin(origin);
      setRouteSummary(null);
    }, DIRECTIONS_DEBOUNCE_MS);

    return () => {
      if (directionsDebounceRef.current) {
        clearTimeout(directionsDebounceRef.current);
        directionsDebounceRef.current = null;
      }
    };
  }, [origin, destination]);

  useEffect(() => {
    if (!fetchOrigin || !destination) return undefined;

    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    let cancelled = false;

    (async () => {
      try {
        const result = await fetchDrivingRoute(fetchOrigin, destination, GOOGLE_MAPS_API_KEY, {
          signal: controller.signal,
        });
        if (cancelled) return;
        setDirectionsError("");
        setRouteSummary(buildRouteSummaryFromDirections(result));
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;
        const message = err?.message || "Could not load driving directions";
        setDirectionsError(message);
        setRouteSummary(null);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    destination?.latitude,
    destination?.longitude,
    fetchOrigin?.latitude,
    fetchOrigin?.longitude,
  ]);

  const isLoadingRoute = Boolean(
    origin && destination && !routeSummary && !directionsError,
  );

  const statusText = useMemo(() => {
    const status = orderStatus || TRACKABLE_STATUS;
    if (status === TRACKABLE_STATUS) {
      return t("tracking.progress.statusOutForDelivery");
    }
    return status;
  }, [orderStatus, t]);

  const driverText = useMemo(() => {
    if (!origin) {
      return t("tracking.progress.driverWaitingLocation", { name: resolvedDriverName });
    }
    if (audience === "depot") {
      const name =
        (typeof customerName === "string" && customerName.trim()) ||
        t("depot.trackingCustomer");
      return t("tracking.progress.driverEnRouteCustomer", { name });
    }
    return t("tracking.progress.driverEnRouteYou");
  }, [audience, customerName, origin, resolvedDriverName, t]);

  const distanceText = useMemo(() => {
    if (!destination) {
      return t("tracking.progress.locationNeeded");
    }
    if (!origin) {
      return isLoadingRoute ? t("tracking.progress.etaCalculating") : t("tracking.progress.etaUnavailable");
    }
    const km = effectiveSummary?.kmLabel ?? formatDistanceKmLabel(effectiveSummary?.distanceKm);
    if (km != null) {
      return t("tracking.progress.distanceAway", { km });
    }
    if (isLoadingRoute) return t("tracking.progress.etaCalculating");
    return t("tracking.progress.etaUnavailable");
  }, [destination, effectiveSummary, isLoadingRoute, origin, t]);

  const etaText = useMemo(() => {
    if (!destination) {
      return t("tracking.progress.etaUnavailable");
    }
    if (!origin) {
      return t("tracking.progress.etaUnavailable");
    }
    const durationMin = effectiveSummary?.durationMin;
    if (durationMin != null) {
      const window = buildEtaTimeWindow(durationMin);
      if (window) {
        const locale = i18n.language?.startsWith("km") ? "km-KH" : "en-US";
        const formatted = formatEtaWindow(window.start, window.end, locale);
        if (formatted) return formatted;
      }
    }
    if (isLoadingRoute) return t("tracking.progress.etaCalculating");
    return t("tracking.progress.etaUnavailable");
  }, [destination, effectiveSummary, i18n.language, isLoadingRoute, origin, t]);

  const progressRows = useMemo(
    () => [
      { label: t("tracking.progress.statusLabel"), value: statusText },
      { label: t("tracking.progress.driverLabel"), value: driverText },
      {
        label: t("tracking.progress.distanceLabel"),
        value: distanceText,
        loading: isLoadingRoute && Boolean(origin && destination),
      },
      {
        label: t("tracking.progress.etaLabel"),
        value: etaText,
        loading: isLoadingRoute && Boolean(origin && destination),
      },
    ],
    [distanceText, driverText, etaText, isLoadingRoute, origin, destination, statusText, t],
  );

  return {
    routeSummary: effectiveSummary,
    directionsError,
    isLoadingRoute,
    progressRows,
    resetRoute: useCallback(() => {
      fetchAbortRef.current?.abort();
      setRouteSummary(null);
      setDirectionsError("");
      setFetchOrigin(null);
    }, []),
  };
}
