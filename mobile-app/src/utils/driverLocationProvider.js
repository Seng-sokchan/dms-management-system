import { Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { ensureLocationPermission } from "./locationPermission";

export async function ensureDriverLocationReady() {
  return ensureLocationPermission();
}

export function getCurrentDriverPositionAsync(options) {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function watchDriverPosition(success, error, options) {
  if (Platform.OS === "ios") {
    Geolocation.setRNConfiguration({
      authorizationLevel: "whenInUse",
      skipPermissionRequests: false,
    });
  }
  return Geolocation.watchPosition(success, error, options);
}

export function clearDriverWatch(watchId) {
  if (watchId != null) {
    Geolocation.clearWatch(watchId);
  }
}
