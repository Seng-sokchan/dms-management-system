export const API_BASE_URL = "http://10.0.2.2:4000/api";

/**
 * Google Maps API key (Maps SDK + Directions API must be enabled in Google Cloud).
 * Keep in sync with MAPS_API_KEY in android/gradle.properties for native maps.
 */
export const GOOGLE_MAPS_API_KEY = "AIzaSyBPrDoLJdrzc0swEAxefLb_JgF6hD7I6To";

/**
 * Use a fixed test GPS instead of the device GPS (map, nearest stop, live tracking).
 * Set to false when you want real device location.
 */
export const USE_FAKE_DRIVER_LOCATION = true;

/** Starting point for fake GPS (central Phnom Penh). */
export const FAKE_DRIVER_LOCATION = {
  latitude: 11.5564,
  longitude: 104.9282,
};

/**
 * When true, fake GPS drifts slowly so the map marker and socket updates move.
 * Only applies when USE_FAKE_DRIVER_LOCATION is true.
 */
export const FAKE_DRIVER_SIMULATE_MOVE = true;

/**
 * If your backend customer mapping is not discoverable for first-time orders,
 * set this value manually to the related customer record id.
 */
export const FALLBACK_CUSTOMER_ID = "";