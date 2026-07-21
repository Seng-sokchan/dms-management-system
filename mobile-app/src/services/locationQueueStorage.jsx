import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dms:delivery-location-queue";
const MAX_QUEUE_SIZE = 200;

function normalizeEntry(entry) {
  const latitude = Number(entry?.latitude);
  const longitude = Number(entry?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const accuracy =
    entry?.accuracy != null && Number.isFinite(Number(entry.accuracy))
      ? Number(entry.accuracy)
      : undefined;
  const recordedAt =
    typeof entry?.recordedAt === "string" && entry.recordedAt.trim()
      ? entry.recordedAt.trim()
      : new Date().toISOString();
  return { latitude, longitude, accuracy, recordedAt };
}

async function readQueueRaw() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean);
  } catch {
    return [];
  }
}

async function writeQueue(items) {
  const normalized = items.map(normalizeEntry).filter(Boolean);
  const trimmed =
    normalized.length > MAX_QUEUE_SIZE
      ? normalized.slice(normalized.length - MAX_QUEUE_SIZE)
      : normalized;
  if (trimmed.length === 0) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
}

/**
 * Persist a GPS point while offline. Oldest entries are dropped when the cap is reached.
 */
export async function enqueueDeliveryLocation(entry) {
  const normalized = normalizeEntry(entry);
  if (!normalized) return;
  const queue = await readQueueRaw();
  queue.push(normalized);
  await writeQueue(queue);
}

/** @returns {Promise<Array<{ latitude: number, longitude: number, accuracy?: number, recordedAt: string }>>} */
export async function readDeliveryLocationQueue() {
  return readQueueRaw();
}

export async function replaceDeliveryLocationQueue(items) {
  await writeQueue(Array.isArray(items) ? items : []);
}

export async function clearDeliveryLocationQueue() {
  await AsyncStorage.removeItem(KEY);
}
