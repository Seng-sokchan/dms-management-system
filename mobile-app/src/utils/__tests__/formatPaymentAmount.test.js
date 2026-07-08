import {
  formatPaymentAmount,
  formatPaymentAmountParts,
  formatCurrencyLabel,
} from "../formatPaymentAmount";

describe("formatPaymentAmount", () => {
  it("formats KHR with rounded locale value", () => {
    const parts = formatPaymentAmountParts(40000, "KHR");
    expect(parts.value).toBe((40000).toLocaleString());
    expect(parts.unit).toBe("KHR");
    expect(formatPaymentAmount(40000, "KHR")).toContain("KHR");
  });

  it("formats USD with two decimals", () => {
    const parts = formatPaymentAmountParts(12.5, "USD");
    expect(parts.value).toBe("12.50");
    expect(parts.unit).toBe("USD");
  });

  it("returns em dash for invalid amounts", () => {
    expect(formatPaymentAmountParts("abc", "KHR")).toEqual({ value: "—", unit: "" });
    expect(formatPaymentAmount("abc", "USD")).toBe("—");
  });

  it("formatCurrencyLabel returns currency labels", () => {
    expect(formatCurrencyLabel("KHR")).toBe("KHR");
    expect(formatCurrencyLabel("USD")).toBe("USD");
  });
});
