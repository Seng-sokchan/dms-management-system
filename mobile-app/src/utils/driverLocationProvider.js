import { Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import {
  FAKE_DRIVER_LOCATION,
  FAKE_DRIVER_SIMULATE_MOVE,
  USE_FAKE_DRIVER_LOCATION,
} from "../config/appConfig";
import { ensureLocationPermission } from "./locationPermission";

const FAKE_WATCH_PREFIX = "fake-watch-";
const FAKE_TICK_MS = 5000;
/** ~40 m per tick when simulate move is on. */
const FAKE_STEP_LAT = 0.00036;
const FAKE_STEP_LNG = 0.00036;

let fakeWatchSeq = 0;
/** @type {Map<string, { intervalId: ReturnType<typeof setInterval>, lat: number, lng: number, step: number }>} */
const fakeWatches = new Map();

function buildPosition(latitude, longitude) {
  return {
    coords: {
      latitude,
      longitude,
      accuracy: 8,
      altitude: 0,
      heading: 0,
      speed: FAKE_DRIVER_SIMULATE_MOVE ? 2.5 : 0,
    },
    timestamp: Date.now(),
  };
}

function getFakeCoords() {
  return {
    latitude: Number(FAKE_DRIVER_LOCATION.latitude),
    longitude: Number(FAKE_DRIVER_LOCATION.longitude),
  };
}

export function isUsingFakeDriverLocation() {
  return USE_FAKE_DRIVER_LOCATION;
}

export async function ensureDriverLocationReady() {
  if (USE_FAKE_DRIVER_LOCATION) return true;
  return ensureLocationPermission();
}

export function getCurrentDriverPositionAsync(options) {
  if (USE_FAKE_DRIVER_LOCATION) {
    const { latitude, longitude } = getFakeCoords();
    return Promise.resolve(buildPosition(latitude, longitude));
  }
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function emitFakeWatch(watchKey) {
  const entry = fakeWatches.get(watchKey);
  if (!entry) return;
  const { onSuccess } = entry;
  if (FAKE_DRIVER_SIMULATE_MOVE) {
    entry.step += 1;
    entry.lat += FAKE_STEP_LAT;
    entry.lng += FAKE_STEP_LNG * (entry.step % 4 === 0 ? -1 : 1);
  }
  onSuccess(buildPosition(entry.lat, entry.lng));
}

export function watchDriverPosition(success, error, options) {
  if (!USE_FAKE_DRIVER_LOCATION) {
    if (Platform.OS === "ios") {
      Geolocation.setRNConfiguration({
        authorizationLevel: "whenInUse",
        skipPermissionRequests: false,
      });
    }
    return Geolocation.watchPosition(success, error, options);
  }

  const { latitude, longitude } = getFakeCoords();
  const watchKey = `${FAKE_WATCH_PREFIX}${++fakeWatchSeq}`;
  const entry = {
    onSuccess: success,
    onError: error,
    lat: latitude,
    lng: longitude,
    step: 0,
    intervalId: null,
  };
  fakeWatches.set(watchKey, entry);

  success(buildPosition(latitude, longitude));
  entry.intervalId = setInterval(() => emitFakeWatch(watchKey), FAKE_TICK_MS);

  return watchKey;
}

export function clearDriverWatch(watchId) {
  if (watchId != null && String(watchId).startsWith(FAKE_WATCH_PREFIX)) {
    const entry = fakeWatches.get(String(watchId));
    if (entry?.intervalId != null) {
      clearInterval(entry.intervalId);
    }
    fakeWatches.delete(String(watchId));
    return;
  }
  if (watchId != null) {
    Geolocation.clearWatch(watchId);
  }
}
