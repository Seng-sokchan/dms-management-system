import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  clearPersistedCart,
  loadPersistedCart,
  savePersistedCart,
} from "../services/cartStorage";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartRestored, setCartRestored] = useState(false);
  const skipNextPersist = useRef(true);

  useEffect(() => {
    const { items: saved, restored } = loadPersistedCart();
    setItems(saved);
    setCartRestored(restored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    savePersistedCart(items);
  }, [hydrated, items]);

  function dismissCartRestored() {
    setCartRestored(false);
  }

  function addItem(item) {
    setItems((prev) => {
      const found = prev.find((entry) => entry.item.id === item.id);
      if (found) {
        return prev.map((entry) => (
          entry.item.id === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        ));
      }
      return [...prev, { item, quantity: 1 }];
    });
  }

  function updateQuantity(itemId, quantity) {
    const nextQty = Math.max(0, Number(quantity) || 0);
    setItems((prev) => (
      nextQty === 0
        ? prev.filter((entry) => entry.item.id !== itemId)
        : prev.map((entry) => (entry.item.id === itemId ? { ...entry, quantity: nextQty } : entry))
    ));
  }

  function removeItem(itemId) {
    setItems((prev) => prev.filter((entry) => entry.item.id !== itemId));
  }

  function clearCart() {
    setItems([]);
    clearPersistedCart();
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const value = useMemo(() => ({
    items,
    totalItems,
    cartRestored,
    dismissCartRestored,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [items, totalItems, cartRestored]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
