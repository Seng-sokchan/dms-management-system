import i18n from "../i18n/config";

export function formatCurrencyLabel(currency) {
  if (String(currency || "").toUpperCase() === "KHR") {
    return i18n.t("currency.khr");
  }
  return i18n.t("currency.usd");
}

export function formatPaymentAmount(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  if (String(currency || "").toUpperCase() === "KHR") {
    return `${Math.round(n).toLocaleString()} ${formatCurrencyLabel(currency)}`;
  }
  return `${n.toFixed(2)} ${formatCurrencyLabel(currency)}`;
}
