import { Linking, Platform } from "react-native";

const ABA_PROBE_URLS = [
  "abamobilebank://ababank.com",
  "abamobilebank://",
];

/**
 * Returns true when ABA Mobile appears installed (scheme is reachable).
 * @param {string} [deeplinkUrl] Optional full PayWay deeplink to probe first.
 */
export async function checkAbaMobileInstalled(deeplinkUrl) {
  const candidates = [];
  if (deeplinkUrl && String(deeplinkUrl).trim()) {
    candidates.push(String(deeplinkUrl).trim());
  }
  for (const url of ABA_PROBE_URLS) {
    if (!candidates.includes(url)) candidates.push(url);
  }

  for (const url of candidates) {
    try {
      if (await Linking.canOpenURL(url)) return true;
    } catch {
      // try next probe
    }
  }

  // Android 11+ often reports false for custom schemes even when the app is installed.
  if (Platform.OS === "android" && deeplinkUrl) {
    return true;
  }

  return false;
}
