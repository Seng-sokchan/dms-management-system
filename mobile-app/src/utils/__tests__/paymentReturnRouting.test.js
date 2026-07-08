jest.mock("../../navigation/paymentReturnNavigation", () => ({
  navigateToBatchOrderPaymentDeferred: jest.fn(),
  navigateToOrderPaymentDeferred: jest.fn(),
  navigateToPaymentResultDeferred: jest.fn(),
}));

import { isIntentExpired } from "../paymentReturnRouting";

describe("isIntentExpired", () => {
  it("returns true for past expiresAt", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isIntentExpired(past)).toBe(true);
  });

  it("returns false for future expiresAt", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isIntentExpired(future)).toBe(false);
  });

  it("returns false when expiresAt is missing", () => {
    expect(isIntentExpired(null)).toBe(false);
    expect(isIntentExpired(undefined)).toBe(false);
  });

  it("returns false for invalid date", () => {
    expect(isIntentExpired("not-a-date")).toBe(false);
  });
});
