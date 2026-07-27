import { detectMobilePlatform, isPhoneOrTabletPlatform } from "./detectMobilePlatform";

function trimEnv(value) {
  return String(value || "").trim();
}

export function getPlayStoreUrl() {
  return trimEnv(
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_PLAY_STORE_URL : "",
  );
}

export function getAppStoreUrl() {
  return trimEnv(
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_APP_STORE_URL : "",
  );
}

/**
 * @param {"android" | "ios" | "other"} platform
 * @returns {string}
 */
export function getStoreUrlForPlatform(platform) {
  if (platform === "android") return getPlayStoreUrl();
  if (platform === "ios") return getAppStoreUrl();
  return "";
}

/**
 * Only Android / iOS devices with a matching store URL see the get-app screen.
 * Desktop browsers keep the web portal.
 */
export function shouldShowStorePrompt(platform = detectMobilePlatform()) {
  if (!isPhoneOrTabletPlatform(platform)) return false;
  return Boolean(getStoreUrlForPlatform(platform));
}
