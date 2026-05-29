import { Alert, Linking, Platform } from "react-native";

const ABA_SCHEME = "abamobilebank";
const ABA_PLAY_STORE = "market://details?id=com.paygo24.ibank";
const ABA_PLAY_STORE_HTTPS =
  "https://play.google.com/store/apps/details?id=com.paygo24.ibank";

/**
 * Open ABA Mobile via PayWay deeplink. Android 11+ blocks canOpenURL for custom schemes
 * unless declared in manifest <queries> — we open directly and fall back to Play/App Store.
 */
export async function openAbaPaywayCheckout(intent, { t } = {}) {
  const deeplink = intent?.deeplinkUrl ? String(intent.deeplinkUrl).trim() : "";
  const checkoutUrl = intent?.checkoutUrl ? String(intent.checkoutUrl).trim() : "";
  const playStore = intent?.playStoreUrl || ABA_PLAY_STORE;
  const appStore = intent?.appStoreUrl;

  if (deeplink) {
    try {
      if (Platform.OS === "android") {
        await Linking.openURL(deeplink);
        return { opened: "aba", url: deeplink };
      }
      const canOpen = await Linking.canOpenURL(deeplink);
      if (canOpen) {
        await Linking.openURL(deeplink);
        return { opened: "aba", url: deeplink };
      }
    } catch {
      /* try fallbacks below */
    }
  }

  if (checkoutUrl) {
    try {
      await Linking.openURL(checkoutUrl);
      return { opened: "checkout", url: checkoutUrl };
    } catch {
      /* continue */
    }
  }

  if (Platform.OS === "android") {
    try {
      await Linking.openURL(playStore);
      return { opened: "store", url: playStore };
    } catch {
      try {
        await Linking.openURL(ABA_PLAY_STORE_HTTPS);
        return { opened: "store", url: ABA_PLAY_STORE_HTTPS };
      } catch {
        /* fall through */
      }
    }
  } else if (appStore) {
    try {
      await Linking.openURL(appStore);
      return { opened: "store", url: appStore };
    } catch {
      /* fall through */
    }
  }

  const title = t?.("payment.openAbaFailed") || "Could not open ABA";
  const message =
    t?.("payment.openAbaFailedHint") ||
    "Install ABA Mobile from the app store, then try again.";
  Alert.alert(title, message);
  return { opened: false };
}
