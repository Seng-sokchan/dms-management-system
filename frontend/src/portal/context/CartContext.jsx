import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

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
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const value = useMemo(() => ({
    items,
    totalItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [items, totalItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
