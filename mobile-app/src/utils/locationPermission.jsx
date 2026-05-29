import { PermissionsAndroid, Platform } from "react-native";

/**
 * Request runtime location access on Android (fine + coarse for Play Services / API 31+).
 */
export async function ensureLocationPermission() {
  if (Platform.OS !== "android") {
    return true;
  }

  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

  const hasFine = await PermissionsAndroid.check(fine);
  if (hasFine) {
    return true;
  }

  const results = await PermissionsAndroid.requestMultiple([fine, coarse]);
  const fineResult = results[fine];
  const coarseResult = results[coarse];
  return (
    fineResult === PermissionsAndroid.RESULTS.GRANTED
    || coarseResult === PermissionsAndroid.RESULTS.GRANTED
  );
}
