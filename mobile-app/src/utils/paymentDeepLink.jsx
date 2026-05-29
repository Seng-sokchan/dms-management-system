/** Must match Android intent-filter and iOS CFBundleURLSchemes (dms). */
export const PAYMENT_RETURN_HOST = "payment";
export const PAYMENT_RETURN_PATH = "/result";
export const PAYMENT_SUCCESS_PATH = "/result/success";

/** Default; backend PAYWAY_RETURN_DEEPLINK_BASE should use the same. */
export const PAYMENT_RESULT_PREFIX = `dms://${PAYMENT_RETURN_HOST}${PAYMENT_SUCCESS_PATH}`;

function isPaymentReturnUrl(url) {
  if (!url || typeof url !== "string") return false;
  return (
    url.startsWith(`dms://${PAYMENT_RETURN_HOST}${PAYMENT_RETURN_PATH}`)
    || url.startsWith(PAYMENT_RESULT_PREFIX)
  );
}

/**
 * Parse PayWay / ABA return deeplink (opened after customer finishes in ABA Mobile).
 * @returns {{ paymentId: string, fromAbaReturn: boolean } | null}
 */
export function parsePaymentDeepLink(url) {
  if (!isPaymentReturnUrl(url)) return null;
  try {
    const normalized = url.includes("://") ? url : `${PAYMENT_RESULT_PREFIX}?${url.split("?")[1] || ""}`;
    const query = normalized.split("?")[1] || "";
    const params = new URLSearchParams(query);
    const paymentId = params.get("paymentId");
    if (!paymentId?.trim()) return null;
    const fromAbaReturn =
      params.get("fromAba") === "1"
      || normalized.includes(PAYMENT_SUCCESS_PATH);
    return { paymentId: paymentId.trim(), fromAbaReturn };
  } catch {
    const match = url.match(/paymentId=([^&]+)/i);
    if (!match?.[1]) return null;
    return {
      paymentId: decodeURIComponent(match[1]).trim(),
      fromAbaReturn: url.includes("/success") || /fromAba=1/i.test(url),
    };
  }
}

/** @deprecated Use parsePaymentDeepLink */
export function parsePaymentIdFromUrl(url) {
  return parsePaymentDeepLink(url)?.paymentId ?? null;
}
