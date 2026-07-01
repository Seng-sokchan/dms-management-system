/**
 * Build ABA Mobile PayWay deeplink from KHQR payload (mirrors backend paywayResponse.js).
 * @param {string} qrString
 * @returns {string|null}
 */
export function buildAbaDeeplink(qrString) {
  if (!qrString || !String(qrString).trim()) return null;
  return `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(String(qrString).trim())}`;
}
