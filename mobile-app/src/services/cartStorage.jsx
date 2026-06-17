import AsyncStorage from "@react-native-async-storage/async-storage";

export const CART_STORAGE_KEY = "dms-customer-cart";

export async function loadPersistedCart() {
  try {
    const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [], restored: false };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { items: [], restored: false };
    const items = parsed.filter(
      (entry) => entry?.item?.id != null && Number(entry.quantity) > 0,
    );
    return { items, restored: items.length > 0 };
  } catch {
    return { items: [], restored: false };
  }
}

export async function savePersistedCart(items) {
  try {
    if (!items?.length) {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export async function clearPersistedCart() {
  try {
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
