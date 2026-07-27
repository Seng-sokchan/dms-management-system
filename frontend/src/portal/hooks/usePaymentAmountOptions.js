import { useCallback, useEffect, useMemo, useState } from "react";
import { getPaymentAmountOptions } from "../services/payments";
import { buildPaymentAmountsFromOrders, normalizePaymentCurrency } from "../utils/paymentCurrency";

const PAYMENT_CURRENCIES = ["KHR", "USD"];

export function usePaymentAmountOptions({ token, orders }) {
  const orderIds = useMemo(
    () => (Array.isArray(orders) ? orders.map((order) => Number(order?.id)).filter(Boolean) : []),
    [orders],
  );
  const fallbackCurrency = normalizePaymentCurrency(orders?.[0]?.currency);
  const fallback = useMemo(() => buildPaymentAmountsFromOrders(orders), [orders]);

  const [currency, setCurrency] = useState(fallbackCurrency);
  const [amounts, setAmounts] = useState(fallback.amounts);
  const [availableCurrencies] = useState(PAYMENT_CURRENCIES);
  const [loading, setLoading] = useState(false);

  const loadAmountOptions = useCallback(async () => {
    if (!token || orderIds.length === 0) return;
    setLoading(true);
    try {
      const data = await getPaymentAmountOptions(token, { orderIds });
      const nextAmounts = data?.amounts || fallback.amounts;
      const nextCurrency = normalizePaymentCurrency(data?.defaultCurrency || fallbackCurrency);

      setAmounts(nextAmounts);
      setCurrency((current) => (PAYMENT_CURRENCIES.includes(current) ? current : nextCurrency));
    } catch {
      setAmounts(fallback.amounts);
      setCurrency(fallbackCurrency);
    } finally {
      setLoading(false);
    }
  }, [fallback, fallbackCurrency, orderIds, token]);

  useEffect(() => {
    void loadAmountOptions();
  }, [loadAmountOptions]);

  const amount = amounts[currency] ?? fallback.amounts[currency] ?? null;

  return {
    currency,
    setCurrency,
    amount,
    amounts,
    availableCurrencies,
    loading,
    reloadAmountOptions: loadAmountOptions,
  };
}
