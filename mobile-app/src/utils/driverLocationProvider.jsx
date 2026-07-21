import { Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { FAKE_DEV_LOCATION, USE_FAKE_DEV_LOCATION } from "../config/appConfig";
import { ensureLocationPermission } from "./locationPermission";

/** @type {Map<number, ReturnType<typeof setInterval>>} */
const fakeWatchTimers = new Map();
let nextFakeWatchId = 1;
let fakeTick = 0;

function buildFakePosition(tick = 0) {
  // Slow northeast drift (~few meters per tick) so maps / socket emits update.
  const step = tick * 0.00012;
  return {
    coords: {
      latitude: FAKE_DEV_LOCATION.latitude + step,
      longitude: FAKE_DEV_LOCATION.longitude + step * 0.85,
      accuracy: 12,
      altitude: 0,
      heading: 45,
      speed: 4.5,
      altitudeAccuracy: 0,
    },
    timestamp: Date.now(),
  };
}

export function isUsingFakeDevLocation() {
  return Boolean(USE_FAKE_DEV_LOCATION);
}

export async function ensureDriverLocationReady() {
  if (USE_FAKE_DEV_LOCATION) return true;
  return ensureLocationPermission();
}

export function getCurrentDriverPositionAsync(options) {
  if (USE_FAKE_DEV_LOCATION) {
    return Promise.resolve(buildFakePosition(fakeTick));
  }
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function watchDriverPosition(success, error, options) {
  if (USE_FAKE_DEV_LOCATION) {
    const watchId = nextFakeWatchId++;
    const intervalMs = Math.max(2000, Number(options?.interval) || 5000);
    const emit = () => {
      try {
        success(buildFakePosition(fakeTick));
        fakeTick += 1;
      } catch (err) {
        error?.(err);
      }
    };
    emit();
    const timer = setInterval(emit, intervalMs);
    fakeWatchTimers.set(watchId, timer);
    return watchId;
  }

  if (Platform.OS === "ios") {
    Geolocation.setRNConfiguration({
      authorizationLevel: "whenInUse",
      skipPermissionRequests: false,
    });
  }
  return Geolocation.watchPosition(success, error, options);
}

export function clearDriverWatch(watchId) {
  if (watchId == null) return;
  if (USE_FAKE_DEV_LOCATION && fakeWatchTimers.has(watchId)) {
    clearInterval(fakeWatchTimers.get(watchId));
    fakeWatchTimers.delete(watchId);
    return;
  }
  Geolocation.clearWatch(watchId);
}
