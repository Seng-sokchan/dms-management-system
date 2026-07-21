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

/** Normalize GPS heading (degrees clockwise from north). Returns null when unavailable. */
export function normalizeHeading(heading) {
  const n = Number(heading);
  if (!Number.isFinite(n) || n < 0) return null;
  return ((n % 360) + 360) % 360;
}

/** Bearing from point A to B in degrees (0 = north, clockwise). */
export function bearingDegrees(from, to) {
  const lat1 = parseCoord(from?.latitude);
  const lng1 = parseCoord(from?.longitude);
  const lat2 = parseCoord(to?.latitude);
  const lng2 = parseCoord(to?.longitude);
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360;
}

/** Absolute smallest angle difference between two headings (0–180). */
export function headingDeltaDegrees(a, b) {
  if (a == null || b == null) return 180;
  return Math.abs(((a - b + 540) % 360) - 180);
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

/**
 * Keep watching the current in-delivery order until it leaves the trackable list,
 * then advance to the next nearest ready order (same idea as driver navigation).
 */
export function resolveActiveTrackableOrderId(trackableOrders, { driverLat, driverLng, currentId } = {}) {
  if (!Array.isArray(trackableOrders) || trackableOrders.length === 0) return "";

  const currentKey = currentId != null && String(currentId).trim() !== "" ? String(currentId) : "";
  if (currentKey && trackableOrders.some((order) => String(order.id) === currentKey)) {
    return currentKey;
  }

  const nearest = pickNearestReadyOrder(trackableOrders, driverLat, driverLng);
  if (nearest?.order?.id != null) return String(nearest.order.id);

  return trackableOrders[0]?.id != null ? String(trackableOrders[0].id) : "";
}

/**
 * Ready-for-delivery orders for the nav list: active stop first, then by driving distance.
 */
export function sortReadyOrdersForNavigation(orders, { activeNavOrderId, driverLat, driverLng } = {}) {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const lat = parseCoord(driverLat);
  const lng = parseCoord(driverLng);

  const distanceFor = (order) => {
    const dest = getOrderDestination(order);
    if (lat == null || lng == null || !dest) return Number.POSITIVE_INFINITY;
    return haversineMeters(lat, lng, dest.latitude, dest.longitude);
  };

  return [...orders]
    .filter((order) => order?.status === READY_STATUS)
    .sort((a, b) => {
      const aActive = activeNavOrderId != null && String(a.id) === String(activeNavOrderId);
      const bActive = activeNavOrderId != null && String(b.id) === String(activeNavOrderId);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      const aHasCoords = orderHasCustomerCoords(a);
      const bHasCoords = orderHasCustomerCoords(b);
      if (aHasCoords && !bHasCoords) return -1;
      if (!aHasCoords && bHasCoords) return 1;

      const distDiff = distanceFor(a) - distanceFor(b);
      if (distDiff !== 0) return distDiff;

      return Number(a.id) - Number(b.id);
    });
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

function coordPair(point) {
  const lat = parseCoord(point?.latitude);
  const lng = parseCoord(point?.longitude);
  if (lat == null || lng == null) return null;
  return `${lat},${lng}`;
}

/**
 * Driving route via Google Directions REST API (no map required).
 * @returns {Promise<{ distance: number, duration: number }>} distance in km, duration in minutes
 */
export async function fetchDrivingRoute(origin, destination, apiKey, { signal } = {}) {
  const originPair = coordPair(origin);
  const destPair = coordPair(destination);
  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  if (!originPair || !destPair) {
    throw new Error("Invalid origin or destination");
  }
  if (!key) {
    throw new Error("Google Maps API key is missing");
  }

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${encodeURIComponent(originPair)}` +
    `&destination=${encodeURIComponent(destPair)}` +
    `&mode=driving&key=${encodeURIComponent(key)}`;

  const res = await fetch(url, { signal });
  const data = await res.json();
  const leg = data?.routes?.[0]?.legs?.[0];
  if (data?.status !== "OK" || !leg) {
    throw new Error(data?.error_message || data?.status || "Could not load driving directions");
  }

  return {
    distance: leg.distance.value / 1000,
    duration: leg.duration.value / 60,
  };
}
