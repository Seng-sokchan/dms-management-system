import { resolveAbaPaymentRoute } from "../resolveAbaPaymentRoute";
import { submitPaymentPurchase } from "../../services/paymentsApi";
import { submitPaywayCheckoutForm } from "../paywayCheckoutClient";
import { checkAbaMobileInstalled } from "../checkAbaMobileInstalled";
import { mockPaymentIntent } from "../../testUtils/paymentFixtures";

jest.mock("../../services/paymentsApi", () => ({
  submitPaymentPurchase: jest.fn(),
}));

jest.mock("../paywayCheckoutClient", () => ({
  submitPaywayCheckoutForm: jest.fn(),
}));

jest.mock("../checkAbaMobileInstalled", () => ({
  checkAbaMobileInstalled: jest.fn(),
}));

describe("resolveAbaPaymentRoute", () => {
  beforeEach(() => {
    submitPaymentPurchase.mockResolvedValue({
      qrString: "qr-data",
      qrImageUrl: "https://example.com/qr.png",
      deeplinkUrl: "abamobilebank://ababank.com?type=payway",
      playStoreUrl: "market://aba",
      appStoreUrl: "https://apps.apple.com/aba",
    });
    submitPaywayCheckoutForm.mockResolvedValue({
      qrString: "qr-data",
      qrImageUrl: "https://example.com/qr.png",
      deeplinkUrl: "abamobilebank://ababank.com?type=payway",
      playStoreUrl: "market://aba",
      appStoreUrl: "https://apps.apple.com/aba",
    });
    checkAbaMobileInstalled.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("uses backend purchase proxy when token and paymentId are available", async () => {
    const route = await resolveAbaPaymentRoute(mockPaymentIntent, "test-token");
    expect(submitPaymentPurchase).toHaveBeenCalledWith("test-token", "pay-001");
    expect(submitPaywayCheckoutForm).not.toHaveBeenCalled();
    expect(route.mode).toBe("khqr_qr");
  });

  it("returns aba_app when ABA is installed", async () => {
    checkAbaMobileInstalled.mockResolvedValue(true);
    const route = await resolveAbaPaymentRoute(mockPaymentIntent, "test-token");
    expect(route.mode).toBe("aba_app");
    expect(route.abaInstalled).toBe(true);
  });

  it("falls back to direct form submit without token", async () => {
    const route = await resolveAbaPaymentRoute(mockPaymentIntent);
    expect(submitPaywayCheckoutForm).toHaveBeenCalledWith(mockPaymentIntent.paywayCheckout);
    expect(submitPaymentPurchase).not.toHaveBeenCalled();
    expect(route.mode).toBe("khqr_qr");
  });

  it("throws when checkout data is missing", async () => {
    await expect(resolveAbaPaymentRoute({})).rejects.toThrow(
      "PayWay checkout form is incomplete",
    );
  });
});
