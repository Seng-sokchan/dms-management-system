const CART_STORAGE_KEY = "dms-customer-cart";

export function loadPersistedCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
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

export function savePersistedCart(items) {
  try {
    if (!items?.length) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* private mode or quota */
  }
}

export function clearPersistedCart() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
