import { formatRouteDistanceKm } from "./deliveryNavigation";

const URBAN_SPEED_KMH = 25;
const DEFAULT_ETA_BUFFER_MIN = 15;

/** km label for "~2.5 km away" (uses route-style rounding). */
export function formatDistanceKmLabel(km) {
  const label = formatRouteDistanceKm(km);
  return label != null ? label : null;
}

/**
 * ETA window from driving duration: start = now + max(0, duration - buffer), end = now + duration + buffer.
 * @returns {{ start: Date, end: Date } | null}
 */
export function buildEtaTimeWindow(durationMin, { bufferMin = DEFAULT_ETA_BUFFER_MIN, now = new Date() } = {}) {
  const minutes = Number(durationMin);
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  const buffer = Math.max(0, Number(bufferMin) || DEFAULT_ETA_BUFFER_MIN);
  const startOffset = Math.max(0, minutes - buffer);
  const endOffset = minutes + buffer;
  const start = new Date(now.getTime() + startOffset * 60 * 1000);
  const end = new Date(now.getTime() + endOffset * 60 * 1000);
  return { start, end };
}

function resolveLocale(locale) {
  if (locale && typeof locale === "string") return locale;
  return "en-US";
}

/** e.g. "3:15 PM" */
export function formatTimeShort(date, locale) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** e.g. "3:15 PM – 4:45 PM" */
export function formatEtaWindow(start, end, locale) {
  if (!(start instanceof Date) || !(end instanceof Date)) return null;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const loc = resolveLocale(locale);
  const startStr = formatTimeShort(start, loc);
  const endStr = formatTimeShort(end, loc);
  if (!startStr || !endStr) return null;
  return `${startStr} – ${endStr}`;
}

/**
 * Straight-line fallback: distance in meters → km + estimated minutes at ~25 km/h.
 * @returns {{ distanceKm: number, durationMin: number } | null}
 */
export function estimateFromHaversine(distanceM) {
  const m = Number(distanceM);
  if (!Number.isFinite(m) || m < 0) return null;
  const distanceKm = m / 1000;
  const durationMin = (distanceKm / URBAN_SPEED_KMH) * 60;
  return { distanceKm, durationMin: Math.max(1, durationMin) };
}
