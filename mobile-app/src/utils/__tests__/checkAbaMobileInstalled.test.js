import { Linking, Platform } from "react-native";
import { checkAbaMobileInstalled } from "../checkAbaMobileInstalled";

describe("checkAbaMobileInstalled", () => {
  const originalOS = Platform.OS;
  let canOpenURLSpy;

  beforeEach(() => {
    canOpenURLSpy = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
  });

  afterEach(() => {
    canOpenURLSpy.mockRestore();
    Platform.OS = originalOS;
  });

  it("returns true when first probe succeeds", async () => {
    canOpenURLSpy.mockResolvedValueOnce(true);
    await expect(checkAbaMobileInstalled("abamobilebank://test")).resolves.toBe(true);
  });

  it("returns false on iOS when all probes fail", async () => {
    Platform.OS = "ios";
    await expect(checkAbaMobileInstalled("abamobilebank://test")).resolves.toBe(false);
  });

  it("returns optimistic true on Android when deeplink is provided", async () => {
    Platform.OS = "android";
    await expect(checkAbaMobileInstalled("abamobilebank://test")).resolves.toBe(true);
  });

  it("returns false on Android without deeplink when probes fail", async () => {
    Platform.OS = "android";
    await expect(checkAbaMobileInstalled()).resolves.toBe(false);
  });
});
