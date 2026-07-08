import {
  parsePaywayClientResponse,
  submitPaywayCheckoutForm,
} from "../paywayCheckoutClient";
import { mockPaywayCheckout, mockPaywaySuccessResponse } from "../../testUtils/paymentFixtures";

describe("paywayCheckoutClient", () => {
  describe("parsePaywayClientResponse", () => {
    it("returns ok false for invalid input", () => {
      const result = parsePaywayClientResponse(null);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Invalid PayWay response");
      expect(result.qrString).toBeNull();
    });

    it("returns ok true for status code 00", () => {
      const result = parsePaywayClientResponse(mockPaywaySuccessResponse);
      expect(result.ok).toBe(true);
      expect(result.qrString).toBe("00020101021234567890");
      expect(result.deeplinkUrl).toContain("abamobilebank://");
    });

    it("returns ok false for error status code", () => {
      const result = parsePaywayClientResponse({
        status: { code: "99", message: "Failed" },
        data: {},
      });
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Failed");
    });

    it("parses field aliases and unescapes URLs", () => {
      const result = parsePaywayClientResponse({
        status: { code: "00" },
        data: {
          qr_string: "qr-alias",
          qr_image: "https:\\/\\/payway.example\\/qr.png",
          abapay_deeplink: "abamobilebank:\\/\\/ababank.com?type=payway",
        },
      });
      expect(result.qrString).toBe("qr-alias");
      expect(result.qrImageUrl).toBe("https://payway.example/qr.png");
      expect(result.deeplinkUrl).toBe("abamobilebank://ababank.com?type=payway");
    });

    it("builds deeplink from qrString when abapay_deeplink is missing", () => {
      const result = parsePaywayClientResponse({
        status: { code: "00" },
        data: { qrString: "khqr-payload" },
      });
      expect(result.deeplinkUrl).toContain("qrcode=khqr-payload");
    });

    it("handles data:image qr images", () => {
      const dataUrl = "data:image/png;base64,abc";
      const result = parsePaywayClientResponse({
        status: { code: "00" },
        data: { qrString: "x", qrImage: dataUrl },
      });
      expect(result.qrImageUrl).toBe(dataUrl);
    });
  });

  describe("submitPaywayCheckoutForm", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    });

    it("throws when checkout form is incomplete", async () => {
      await expect(submitPaywayCheckoutForm({})).rejects.toThrow(
        "PayWay checkout form is incomplete",
      );
    });

    it("returns parsed QR on success", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          text: () => Promise.resolve(JSON.stringify(mockPaywaySuccessResponse)),
        }),
      );

      const result = await submitPaywayCheckoutForm(mockPaywayCheckout);
      expect(result.qrString).toBe("00020101021234567890");
      expect(global.fetch).toHaveBeenCalledWith(
        mockPaywayCheckout.action,
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("throws on invalid JSON response", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          text: () => Promise.resolve("not-json"),
        }),
      );

      await expect(submitPaywayCheckoutForm(mockPaywayCheckout)).rejects.toThrow(
        "PayWay returned an invalid response",
      );
    });

    it("throws on error status code", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          text: () =>
            Promise.resolve(
              JSON.stringify({
                status: { code: "99", message: "Declined" },
                data: { qrString: "x" },
              }),
            ),
        }),
      );

      await expect(submitPaywayCheckoutForm(mockPaywayCheckout)).rejects.toThrow("Declined");
    });

    it("throws when QR data is missing", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          text: () =>
            Promise.resolve(
              JSON.stringify({
                status: { code: "00" },
                data: {},
              }),
            ),
        }),
      );

      await expect(submitPaywayCheckoutForm(mockPaywayCheckout)).rejects.toThrow(
        "PayWay did not return KHQR data",
      );
    });

    it("throws on request timeout", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      global.fetch = jest.fn(() => Promise.reject(abortError));

      await expect(submitPaywayCheckoutForm(mockPaywayCheckout)).rejects.toThrow(
        "PayWay request timed out",
      );
    });
  });
});
