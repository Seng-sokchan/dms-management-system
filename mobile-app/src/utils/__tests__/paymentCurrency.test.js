import {
  KHR_PER_USD,
  normalizePaymentCurrency,
  convertPaymentAmount,
  buildPaymentAmountsFromOrders,
} from "../paymentCurrency";

describe("paymentCurrency", () => {
  describe("normalizePaymentCurrency", () => {
    it("normalizes usd to USD", () => {
      expect(normalizePaymentCurrency("usd")).toBe("USD");
    });

    it("defaults empty to KHR", () => {
      expect(normalizePaymentCurrency()).toBe("KHR");
      expect(normalizePaymentCurrency("")).toBe("KHR");
    });

    it("keeps KHR for non-USD values", () => {
      expect(normalizePaymentCurrency("KHR")).toBe("KHR");
      expect(normalizePaymentCurrency("khr")).toBe("KHR");
    });
  });

  describe("convertPaymentAmount", () => {
    it("converts USD to KHR", () => {
      expect(convertPaymentAmount(10, "USD", "KHR")).toBe(10 * KHR_PER_USD);
    });

    it("converts KHR to USD", () => {
      expect(convertPaymentAmount(4000, "KHR", "USD")).toBe(1);
    });

    it("returns input unchanged for same currency", () => {
      expect(convertPaymentAmount(100, "KHR", "KHR")).toBe(100);
      expect(convertPaymentAmount(12.5, "USD", "USD")).toBe(12.5);
    });

    it("passes through invalid amounts", () => {
      expect(convertPaymentAmount("abc", "USD", "KHR")).toBeNaN();
    });
  });

  describe("buildPaymentAmountsFromOrders", () => {
    it("returns empty fallback for no orders", () => {
      expect(buildPaymentAmountsFromOrders([])).toEqual({
        amounts: {},
        defaultCurrency: "KHR",
      });
    });

    it("builds amounts from a single KHR order", () => {
      const result = buildPaymentAmountsFromOrders([
        { id: 1, amountTotal: 40000, currency: "KHR" },
      ]);
      expect(result.defaultCurrency).toBe("KHR");
      expect(result.amounts.KHR).toBe(40000);
      expect(result.amounts.USD).toBe(10);
    });

    it("sums multiple orders", () => {
      const result = buildPaymentAmountsFromOrders([
        { id: 1, amountTotal: 20000, currency: "KHR" },
        { id: 2, amountTotal: 30000, currency: "KHR" },
      ]);
      expect(result.amounts.KHR).toBe(50000);
      expect(result.amounts.USD).toBe(12.5);
    });

    it("uses USD as default when first order is USD", () => {
      const result = buildPaymentAmountsFromOrders([
        { id: 1, amountTotal: 25, currency: "USD" },
      ]);
      expect(result.defaultCurrency).toBe("USD");
      expect(result.amounts.USD).toBe(25);
      expect(result.amounts.KHR).toBe(100000);
    });
  });
});
