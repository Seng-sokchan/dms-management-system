import { parsePaymentDeepLink, parsePaymentIdFromUrl } from "../paymentDeepLink";

describe("paymentDeepLink", () => {
  it("parses success deeplink with paymentId", () => {
    expect(
      parsePaymentDeepLink("dms://payment/result/success?paymentId=abc"),
    ).toEqual({
      paymentId: "abc",
      fromAbaReturn: true,
    });
  });

  it("parses legacy result path", () => {
    expect(parsePaymentDeepLink("dms://payment/result?paymentId=legacy-1")).toEqual({
      paymentId: "legacy-1",
      fromAbaReturn: false,
    });
  });

  it("sets fromAbaReturn when fromAba=1", () => {
    expect(
      parsePaymentDeepLink("dms://payment/result?paymentId=p1&fromAba=1"),
    ).toEqual({
      paymentId: "p1",
      fromAbaReturn: true,
    });
  });

  it("returns null for non-payment URLs", () => {
    expect(parsePaymentDeepLink("https://example.com")).toBeNull();
    expect(parsePaymentDeepLink(null)).toBeNull();
  });

  it("returns null when paymentId is missing", () => {
    expect(parsePaymentDeepLink("dms://payment/result/success")).toBeNull();
  });

  it("falls back to regex for malformed URLs", () => {
    expect(parsePaymentDeepLink("dms://payment/result/success?paymentId=mal%20formed")).toEqual({
      paymentId: "mal formed",
      fromAbaReturn: true,
    });
  });

  it("parsePaymentIdFromUrl returns paymentId only", () => {
    expect(parsePaymentIdFromUrl("dms://payment/result/success?paymentId=xyz")).toBe("xyz");
  });
});
