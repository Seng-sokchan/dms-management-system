import { buildAbaDeeplink } from "../buildAbaDeeplink";

describe("buildAbaDeeplink", () => {
  it("encodes QR string into deeplink", () => {
    const deeplink = buildAbaDeeplink("khqr+test");
    expect(deeplink).toBe(
      "abamobilebank://ababank.com?type=payway&qrcode=khqr%2Btest",
    );
  });

  it("returns null for empty input", () => {
    expect(buildAbaDeeplink(null)).toBeNull();
    expect(buildAbaDeeplink("")).toBeNull();
    expect(buildAbaDeeplink("   ")).toBeNull();
  });
});
