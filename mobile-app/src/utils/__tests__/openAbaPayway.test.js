import { Linking, Platform } from "react-native";
import { openAbaPaywayCheckout } from "../openAbaPayway";
import { showAppAlert } from "../appAlertBridge";

jest.mock("../appAlertBridge", () => ({
  showAppAlert: jest.fn(),
}));

describe("openAbaPaywayCheckout", () => {
  const originalOS = Platform.OS;
  const t = (key) => key;
  let canOpenURLSpy;
  let openURLSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    canOpenURLSpy = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue();
  });

  afterEach(() => {
    canOpenURLSpy.mockRestore();
    openURLSpy.mockRestore();
    Platform.OS = originalOS;
  });

  it("opens ABA directly on Android with deeplink", async () => {
    Platform.OS = "android";
    const result = await openAbaPaywayCheckout(
      { deeplinkUrl: "abamobilebank://ababank.com?type=payway" },
      { t, fallbackToStore: false },
    );
    expect(result).toEqual({
      opened: "aba",
      url: "abamobilebank://ababank.com?type=payway",
    });
    expect(openURLSpy).toHaveBeenCalledWith("abamobilebank://ababank.com?type=payway");
  });

  it("opens ABA on iOS when canOpenURL is true", async () => {
    Platform.OS = "ios";
    canOpenURLSpy.mockResolvedValue(true);
    const deeplink = "abamobilebank://ababank.com?type=payway";
    const result = await openAbaPaywayCheckout({ deeplinkUrl: deeplink }, { t });
    expect(result.opened).toBe("aba");
    expect(openURLSpy).toHaveBeenCalledWith(deeplink);
  });

  it("returns failed on iOS when deeplink cannot open and store fallback disabled", async () => {
    Platform.OS = "ios";
    const result = await openAbaPaywayCheckout(
      { deeplinkUrl: "abamobilebank://ababank.com" },
      { t, fallbackToStore: false },
    );
    expect(result).toEqual({ opened: "failed" });
  });

  it("falls back to Play Store on Android when no deeplink", async () => {
    Platform.OS = "android";
    const result = await openAbaPaywayCheckout({}, { t });
    expect(result.opened).toBe("store");
    expect(openURLSpy).toHaveBeenCalled();
  });

  it("opens checkout URL when deeplink fails", async () => {
    Platform.OS = "ios";
    const result = await openAbaPaywayCheckout(
      {
        deeplinkUrl: "abamobilebank://fail",
        checkoutUrl: "https://checkout.example",
      },
      { t, fallbackToStore: false },
    );
    expect(result).toEqual({
      opened: "checkout",
      url: "https://checkout.example",
    });
  });

  it("shows themed error alert when all open attempts fail", async () => {
    Platform.OS = "ios";
    openURLSpy.mockRejectedValue(new Error("Cannot open"));
    const result = await openAbaPaywayCheckout({}, { t });
    expect(result).toEqual({ opened: "failed" });
    expect(showAppAlert).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "error", title: "payment.openAbaFailed" }),
    );
  });
});
