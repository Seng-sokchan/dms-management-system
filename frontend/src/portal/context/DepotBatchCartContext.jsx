import { createContext, useCallback, useContext, useMemo, useState } from "react";

const DepotBatchCartContext = createContext(null);

function mergeLineArrays(existing, incoming) {
  const map = new Map();
  for (const row of existing) {
    map.set(String(row.itemId), {
      itemId: String(row.itemId),
      orderedQty: Number(row.orderedQty) || 1,
    });
  }
  for (const row of incoming) {
    const id = String(row.itemId);
    const qty = Number(row.orderedQty) || 1;
    if (map.has(id)) {
      const prev = map.get(id);
      map.set(id, { itemId: id, orderedQty: prev.orderedQty + qty });
    } else {
      map.set(id, { itemId: id, orderedQty: qty });
    }
  }
  return Array.from(map.values());
}

export function DepotBatchCartProvider({ children }) {
  const [cartByCustomer, setCartByCustomer] = useState({});

  const addLine = useCallback((customerId, itemId) => {
    setCartByCustomer((prev) => {
      const key = String(customerId);
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      const id = String(itemId);
      if (existing.some((row) => String(row.itemId) === id)) {
        return prev;
      }
      return {
        ...prev,
        [key]: [...existing, { itemId: id, orderedQty: 1 }],
      };
    });
  }, []);

  const mergeDraft = useCallback((draft) => {
    if (!draft || typeof draft !== "object") return 0;
    let addedLines = 0;
    setCartByCustomer((prev) => {
      const next = { ...prev };
      for (const [customerId, lines] of Object.entries(draft)) {
        if (!Array.isArray(lines) || lines.length === 0) continue;
        const key = String(customerId);
        const existing = Array.isArray(next[key]) ? next[key] : [];
        const merged = mergeLineArrays(existing, lines);
        addedLines += lines.length;
        next[key] = merged;
      }
      return next;
    });
    return addedLines;
  }, []);

  const updateLineQty = useCallback((customerId, itemId, nextQty) => {
    setCartByCustomer((prev) => {
      const key = String(customerId);
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      const cleaned = existing.map((row) =>
        String(row.itemId) === String(itemId)
          ? { ...row, orderedQty: Math.max(1, Number(nextQty) || 1) }
          : row,
      );
      return { ...prev, [key]: cleaned };
    });
  }, []);

  const removeLine = useCallback((customerId, itemId) => {
    setCartByCustomer((prev) => {
      const key = String(customerId);
      const existing = Array.isArray(prev[key]) ? prev[key] : [];
      const filtered = existing.filter((row) => String(row.itemId) !== String(itemId));
      const next = { ...prev };
      if (filtered.length === 0) delete next[key];
      else next[key] = filtered;
      return next;
    });
  }, []);

  const clearCustomer = useCallback((customerId) => {
    setCartByCustomer((prev) => {
      const next = { ...prev };
      delete next[String(customerId)];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setCartByCustomer({});
  }, []);

  const totalLines = useMemo(
    () =>
      Object.values(cartByCustomer).reduce(
        (acc, lines) => acc + (Array.isArray(lines) ? lines.length : 0),
        0,
      ),
    [cartByCustomer],
  );

  const customerCount = useMemo(
    () =>
      Object.values(cartByCustomer).filter((lines) => Array.isArray(lines) && lines.length > 0)
        .length,
    [cartByCustomer],
  );

  const value = useMemo(
    () => ({
      cartByCustomer,
      totalLines,
      customerCount,
      addLine,
      mergeDraft,
      updateLineQty,
      removeLine,
      clearCustomer,
      clearAll,
    }),
    [
      addLine,
      cartByCustomer,
      clearAll,
      clearCustomer,
      customerCount,
      mergeDraft,
      removeLine,
      totalLines,
      updateLineQty,
    ],
  );

  return (
    <DepotBatchCartContext.Provider value={value}>{children}</DepotBatchCartContext.Provider>
  );
}

export function useDepotBatchCart() {
  const ctx = useContext(DepotBatchCartContext);
  if (!ctx) throw new Error("useDepotBatchCart must be used inside DepotBatchCartProvider");
  return ctx;
}
