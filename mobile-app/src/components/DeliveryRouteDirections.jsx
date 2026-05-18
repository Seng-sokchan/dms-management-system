import React, { useEffect, useState } from "react";
import MapViewDirections from "react-native-maps-directions";
import { GOOGLE_MAPS_API_KEY } from "../config/appConfig";
import { useTheme } from "../context/ThemeContext";

/**
 * Road route from driver → destination via Google Directions API.
 */
export function DeliveryRouteDirections({ origin, destination, onReady, onError }) {
  const { colors } = useTheme();
  const [routeKey, setRouteKey] = useState(0);
  const apiKey = GOOGLE_MAPS_API_KEY?.trim() || "";

  useEffect(() => {
    setRouteKey((k) => k + 1);
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  useEffect(() => {
    if (!origin || !destination) return;
    if (!apiKey) {
      onError?.("Google Maps API key is missing in appConfig.js");
    }
  }, [apiKey, destination, onError, origin]);

  if (!origin || !destination) return null;
  if (!apiKey) return null;

  return (
    <MapViewDirections
      key={routeKey}
      origin={origin}
      destination={destination}
      apikey={apiKey}
      mode="DRIVING"
      precision="high"
      strokeWidth={4}
      strokeColor={colors.primary}
      onReady={(result) => {
        onError?.("");
        onReady?.(result);
      }}
      onError={(message) => {
        const text =
          typeof message === "string"
            ? message
            : message?.message || "Could not load driving directions";
        onError?.(text);
      }}
    />
  );
}
