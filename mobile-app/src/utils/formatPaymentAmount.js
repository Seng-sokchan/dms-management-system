export function formatPaymentAmount(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  if (String(currency || "").toUpperCase() === "KHR") {
    return `${Math.round(n).toLocaleString()} KHR`;
  }
  return `${n.toFixed(2)} USD`;
}
