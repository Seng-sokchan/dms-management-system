import { Linking } from "react-native";

const ABA_PROBE_URL = "abamobilebank://";

/**
 * Returns true when ABA Mobile appears installed (scheme is reachable).
 * Falls back to false on any error so checkout uses the KHQR QR path.
 */
export async function checkAbaMobileInstalled() {
  try {
    return await Linking.canOpenURL(ABA_PROBE_URL);
  } catch {
    return false;
  }
}
