/**
 * @returns {"android" | "ios" | "other"}
 */
export function detectMobilePlatform(
  userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "",
) {
  const ua = String(userAgent || "");

  const uaData = typeof navigator !== "undefined" ? navigator.userAgentData : null;
  if (uaData?.platform) {
    const platform = String(uaData.platform).toLowerCase();
    if (platform.includes("android")) return "android";
    if (platform === "ios" || platform.includes("iphone") || platform.includes("ipad")) {
      return "ios";
    }
  }

  if (/android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";

  if (
    typeof navigator !== "undefined" &&
    /Macintosh/i.test(ua) &&
    Number(navigator.maxTouchPoints || 0) > 1
  ) {
    return "ios";
  }

  return "other";
}

/** True for phone/tablet Android or iOS (not desktop). */
export function isPhoneOrTabletPlatform(platform = detectMobilePlatform()) {
  return platform === "android" || platform === "ios";
}
