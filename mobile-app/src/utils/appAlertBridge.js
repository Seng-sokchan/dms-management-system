/**
 * Imperative bridge so non-React modules (utils) can show themed alerts.
 * Wired by AlertProvider on mount; falls back to no-op when unregistered.
 */

let showImpl = null;
let hideImpl = null;

export function registerAppAlertHandlers({ show, hide }) {
  showImpl = typeof show === "function" ? show : null;
  hideImpl = typeof hide === "function" ? hide : null;
  return () => {
    showImpl = null;
    hideImpl = null;
  };
}

export function showAppAlert(options) {
  if (!showImpl) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[AppAlert] showAppAlert called before AlertProvider mounted", options);
    }
    return;
  }
  showImpl(options);
}

export function hideAppAlert() {
  hideImpl?.();
}

/** Drop-in replacement for Alert.alert(title, message?, buttons?, options?) */
export function appAlert(title, message, buttons, options) {
  const actions = Array.isArray(buttons)
    ? buttons.map((btn) => ({
        text: btn?.text ?? "OK",
        style: btn?.style,
        onPress: btn?.onPress,
      }))
    : undefined;

  showAppAlert({
    title,
    message,
    tone: options?.tone || "info",
    actions,
    dismissible: options?.cancelable !== false,
  });
}
