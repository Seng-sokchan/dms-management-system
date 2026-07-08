const KHR_PER_USD = Number(process.env.KHR_PER_USD || 4000);

function normalizePaymentCurrency(currency) {
  return String(currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
}

function convertPaymentAmount(amount, fromCurrency, toCurrency) {
  const from = normalizePaymentCurrency(fromCurrency);
  const to = normalizePaymentCurrency(toCurrency);
  const value = Number(amount);
  if (!Number.isFinite(value) || from === to) return value;
  if (from === "USD" && to === "KHR") return Math.round(value * KHR_PER_USD);
  if (from === "KHR" && to === "USD") return Number((value / KHR_PER_USD).toFixed(2));
  return value;
}

module.exports = {
  KHR_PER_USD,
  normalizePaymentCurrency,
  convertPaymentAmount,
};
