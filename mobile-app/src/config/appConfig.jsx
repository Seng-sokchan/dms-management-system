// Android emulator: 10.0.2.2 reaches the host machine. Physical device: use your PC LAN IP.
const DEV_API_BASE_URL = "http://10.0.2.2:4000/v1";

export const API_BASE_URL = __DEV__
  ? DEV_API_BASE_URL
  : "https://api.dmscambodia.com/v1";
export const GOOGLE_MAPS_API_KEY = "AIzaSyBLKpup-IpvfhNJY5IlInTzrf-pQZCO3gk";
export const FALLBACK_CUSTOMER_ID = "";
