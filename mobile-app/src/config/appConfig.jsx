// Android emulator: 10.0.2.2 reaches the host machine. Physical device: use your PC LAN IP.
const DEV_API_BASE_URL = "http://10.0.2.2:4000/v1";

export const API_BASE_URL = __DEV__
  ? DEV_API_BASE_URL
  : "https://api.dmscambodia.com/v1";
export const GOOGLE_MAPS_API_KEY = "AIzaSyBLKpup-IpvfhNJY5IlInTzrf-pQZCO3gk";
export const FALLBACK_CUSTOMER_ID = "";

/** Public legal pages — canonical HTML on the website; shown in-app via WebView. */
export const PRIVACY_POLICY_URL = "https://dmscambodia.com/privacy";
export const TERMS_OF_SERVICE_URL = "https://dmscambodia.com/terms";
export const SUPPORT_EMAIL = "novsokleap4@gmail.com";

/**
 * In __DEV__, skip device GPS and simulate a moving point around Phnom Penh
 * (Independence Monument area) so delivery tracking works on emulator / desk.
 * Set to false to use real GPS while still on a dev build.
 */
export const USE_FAKE_DEV_LOCATION = __DEV__;

/** Starting fake GPS (Phnom Penh). */
export const FAKE_DEV_LOCATION = {
  latitude: 11.5564,
  longitude: 104.9282,
};
