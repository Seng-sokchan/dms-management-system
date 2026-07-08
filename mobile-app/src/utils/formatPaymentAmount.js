import i18n from "../i18n/config";

export function formatCurrencyLabel(currency) {
  if (String(currency || "").toUpperCase() === "KHR") {
    return i18n.t("currency.khr");
  }
  return i18n.t("currency.usd");
}

export function formatPaymentAmount(amount, currency) {
  const { value, unit } = formatPaymentAmountParts(amount, currency);
  if (value === "—") return value;
  return unit ? `${value} ${unit}` : value;
}

export function formatPaymentAmountParts(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return { value: "—", unit: "" };
  if (String(currency || "").toUpperCase() === "KHR") {
    return {
      value: Math.round(n).toLocaleString(),
      unit: formatCurrencyLabel(currency),
    };
  }
  return {
    value: n.toFixed(2),
    unit: formatCurrencyLabel(currency),
  };
}
