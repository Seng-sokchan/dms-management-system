export const KHR_PER_USD = 4000;

export function normalizePaymentCurrency(currency) {
  return String(currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
}

export function convertPaymentAmount(amount, fromCurrency, toCurrency) {
  const from = normalizePaymentCurrency(fromCurrency);
  const to = normalizePaymentCurrency(toCurrency);
  const value = Number(amount);
  if (!Number.isFinite(value) || from === to) return value;
  if (from === "USD" && to === "KHR") return Math.round(value * KHR_PER_USD);
  if (from === "KHR" && to === "USD") return Number((value / KHR_PER_USD).toFixed(2));
  return value;
}

export function buildPaymentAmountsFromOrders(orders) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return { amounts: {}, defaultCurrency: "KHR" };
  }

  const defaultCurrency = normalizePaymentCurrency(orders[0]?.currency);
  const baseTotal = orders.reduce((sum, order) => sum + Number(order?.amountTotal || 0), 0);
  const amounts = {
    [defaultCurrency]: baseTotal,
    KHR: convertPaymentAmount(baseTotal, defaultCurrency, "KHR"),
    USD: convertPaymentAmount(baseTotal, defaultCurrency, "USD"),
  };

  return { amounts, defaultCurrency };
}
