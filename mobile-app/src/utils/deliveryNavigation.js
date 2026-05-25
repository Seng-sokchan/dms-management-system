const READY_STATUS = "Ready_For_Delivery";

export const PHNOM_PENH_REGION = {
  latitude: 11.5564,
  longitude: 104.9282,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

export function parseCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** True when `next` is at least `thresholdM` away from `prev` (both { latitude, longitude }). */
export function shouldRefreshByDistance(prev, next, thresholdM) {
  if (!prev || !next) return Boolean(next);
  const moved = haversineMeters(prev.latitude, prev.longitude, next.latitude, next.longitude);
  return moved >= thresholdM;
}

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function orderHasCustomerCoords(order) {
  const lat = parseCoord(order?.customerLatitude);
  const lng = parseCoord(order?.customerLongitude);
  return lat != null && lng != null;
}

export function getOrderDestination(order) {
  const latitude = parseCoord(order?.customerLatitude);
  const longitude = parseCoord(order?.customerLongitude);
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

/**
 * Among Ready_For_Delivery orders with customer coords, return the nearest to the driver.
 * @returns {{ order: object, distanceM: number } | null}
 */
export function pickNearestReadyOrder(orders, driverLat, driverLng) {
  const lat = parseCoord(driverLat);
  const lng = parseCoord(driverLng);
  if (lat == null || lng == null) return null;
  if (!Array.isArray(orders) || orders.length === 0) return null;

  let best = null;
  for (const order of orders) {
    if (order?.status !== READY_STATUS) continue;
    const dest = getOrderDestination(order);
    if (!dest) continue;
    const distanceM = haversineMeters(lat, lng, dest.latitude, dest.longitude);
    if (!best || distanceM < best.distanceM) {
      best = { order, distanceM };
    }
  }
  return best;
}

export function buildMapRegion(driver, destination, fallbackRegion = PHNOM_PENH_REGION) {
  const dLat = parseCoord(driver?.latitude);
  const dLng = parseCoord(driver?.longitude);
  const destLat = parseCoord(destination?.latitude);
  const destLng = parseCoord(destination?.longitude);

  if (dLat != null && dLng != null && destLat != null && destLng != null) {
    const minLat = Math.min(dLat, destLat);
    const maxLat = Math.max(dLat, destLat);
    const minLng = Math.min(dLng, destLng);
    const maxLng = Math.max(dLng, destLng);
    const latPad = Math.max((maxLat - minLat) * 0.35, 0.02);
    const lngPad = Math.max((maxLng - minLng) * 0.35, 0.02);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat + latPad, 0.04),
      longitudeDelta: Math.max(maxLng - minLng + lngPad, 0.04),
    };
  }

  if (dLat != null && dLng != null) {
    return { latitude: dLat, longitude: dLng, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  }

  if (destLat != null && destLng != null) {
    return { latitude: destLat, longitude: destLng, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  }

  return fallbackRegion;
}

/** Display km from Directions API (`distance` is already in km). */
export function formatRouteDistanceKm(km) {
  const n = Number(km);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n < 1) return n.toFixed(1);
  return n >= 10 ? String(Math.round(n)) : n.toFixed(1);
}

/** Display minutes from Directions API (`duration` is already in minutes). */
export function formatRouteDurationMin(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n < 0) return null;
  return String(Math.max(1, Math.round(n)));
}

export function buildRouteSummaryFromDirections(result) {
  if (!result) return null;
  const km = formatRouteDistanceKm(result.distance);
  const minutes = formatRouteDurationMin(result.duration);
  if (km == null || minutes == null) return null;
  return { distanceKm: result.distance, durationMin: result.duration, kmLabel: km, minutesLabel: minutes };
}
