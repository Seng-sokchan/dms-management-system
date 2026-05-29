import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const DeliveryCartContext = createContext(null);

export function DeliveryCartProvider({ children }) {
  const [cartOrderIds, setCartOrderIds] = useState([]);

  const addToCart = useCallback((orderId) => {
    const id = String(orderId);
    setCartOrderIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeFromCart = useCallback((orderId) => {
    const id = String(orderId);
    setCartOrderIds((prev) => prev.filter((entry) => String(entry) !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartOrderIds([]);
  }, []);

  const pruneCartIds = useCallback((orderList, validStatus = "Sent_To_Factory") => {
    const pendingIds = new Set(
      (Array.isArray(orderList) ? orderList : [])
        .filter((order) => order?.status === validStatus)
        .map((order) => String(order.id)),
    );
    setCartOrderIds((prev) => prev.filter((id) => pendingIds.has(String(id))));
  }, []);

  const cartCount = cartOrderIds.length;

  const value = useMemo(
    () => ({
      cartOrderIds,
      cartCount,
      addToCart,
      removeFromCart,
      clearCart,
      pruneCartIds,
    }),
    [cartOrderIds, cartCount, addToCart, removeFromCart, clearCart, pruneCartIds],
  );

  return <DeliveryCartContext.Provider value={value}>{children}</DeliveryCartContext.Provider>;
}

export function useDeliveryCart() {
  const ctx = useContext(DeliveryCartContext);
  if (!ctx) {
    throw new Error("useDeliveryCart must be used inside DeliveryCartProvider");
  }
  return ctx;
}
