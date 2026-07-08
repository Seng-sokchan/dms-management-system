import {
  decodeJwtPayload,
  isAccessTokenExpired,
  isAccountInactiveError,
  isUnauthorizedError,
  isUserInactive,
  notifyUnauthorized,
  registerUnauthorizedHandler,
} from "../authSession";

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  const b64 = globalThis.btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `header.${b64}.sig`;
}

describe("authSession", () => {
  afterEach(() => {
    registerUnauthorizedHandler(null);
  });

  describe("decodeJwtPayload", () => {
    it("returns null for empty or malformed tokens", () => {
      expect(decodeJwtPayload("")).toBeNull();
      expect(decodeJwtPayload("not-a-jwt")).toBeNull();
      expect(decodeJwtPayload(null)).toBeNull();
    });

    it("decodes a valid JWT payload", () => {
      const token = encodePayload({ sub: "1", exp: 1_700_000_000 });
      expect(decodeJwtPayload(token)).toEqual({ sub: "1", exp: 1_700_000_000 });
    });
  });

  describe("isAccessTokenExpired", () => {
    it("returns false when exp is missing", () => {
      expect(isAccessTokenExpired(encodePayload({ sub: "1" }))).toBe(false);
    });

    it("returns true when exp is in the past", () => {
      const token = encodePayload({ exp: Math.floor(Date.now() / 1000) - 60 });
      expect(isAccessTokenExpired(token)).toBe(true);
    });

    it("returns false when exp is in the future beyond skew", () => {
      const token = encodePayload({ exp: Math.floor(Date.now() / 1000) + 3600 });
      expect(isAccessTokenExpired(token)).toBe(false);
    });

    it("treats near-expiry as expired using skew", () => {
      const token = encodePayload({ exp: Math.floor(Date.now() / 1000) + 10 });
      expect(isAccessTokenExpired(token, 30_000)).toBe(true);
    });
  });

  describe("isUnauthorizedError", () => {
    it("detects HTTP 401", () => {
      expect(isUnauthorizedError({ response: { status: 401 } })).toBe(true);
      expect(isUnauthorizedError({ response: { status: 500 } })).toBe(false);
    });

    it("detects UNAUTHORIZED error codes", () => {
      expect(
        isUnauthorizedError({
          response: { status: 403, data: { error: { code: "UNAUTHORIZED" } } },
        }),
      ).toBe(true);
    });
  });

  describe("isAccountInactiveError", () => {
    it("detects ACCOUNT_INACTIVE error codes", () => {
      expect(
        isAccountInactiveError({
          response: { status: 403, data: { error: { code: "ACCOUNT_INACTIVE" } } },
        }),
      ).toBe(true);
      expect(isAccountInactiveError({ response: { status: 403 } })).toBe(false);
    });
  });

  describe("isUserInactive", () => {
    it("detects inactive user payloads", () => {
      expect(isUserInactive({ isActive: false })).toBe(true);
      expect(isUserInactive({ is_active: 0 })).toBe(true);
      expect(isUserInactive({ isActive: true })).toBe(false);
      expect(isUserInactive(null)).toBe(false);
    });
  });

  describe("notifyUnauthorized", () => {
    it("invokes the registered handler once for concurrent calls", async () => {
      const handler = jest.fn(async () => {});
      registerUnauthorizedHandler(handler);

      await Promise.all([notifyUnauthorized("a"), notifyUnauthorized("b")]);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("no-ops when no handler is registered", async () => {
      await expect(notifyUnauthorized()).resolves.toBeUndefined();
    });
  });
});
