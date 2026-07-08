import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AppAlert, { ALERT_TONES } from "../components/ui/AppAlert";
import { registerAppAlertHandlers } from "../utils/appAlertBridge";

const AlertContext = createContext(null);

function normalizeOptions(options = {}) {
  const {
    title = "",
    message = "",
    tone = ALERT_TONES.info,
    actions,
    dismissible = true,
  } = options;

  return {
    title,
    message,
    tone: ALERT_TONES[tone] ? tone : ALERT_TONES.info,
    actions: Array.isArray(actions) ? actions : undefined,
    dismissible: Boolean(dismissible),
  };
}

export function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState(null);

  const hideAlert = useCallback(() => {
    setAlertState(null);
  }, []);

  const showAlert = useCallback((options) => {
    setAlertState(normalizeOptions(options));
  }, []);

  const showError = useCallback(
    (title, message, options) =>
      showAlert({ ...options, title, message, tone: ALERT_TONES.error }),
    [showAlert],
  );

  const showSuccess = useCallback(
    (title, message, options) =>
      showAlert({ ...options, title, message, tone: ALERT_TONES.success }),
    [showAlert],
  );

  const showWarning = useCallback(
    (title, message, options) =>
      showAlert({ ...options, title, message, tone: ALERT_TONES.warning }),
    [showAlert],
  );

  const showInfo = useCallback(
    (title, message, options) =>
      showAlert({ ...options, title, message, tone: ALERT_TONES.info }),
    [showAlert],
  );

  useEffect(() => registerAppAlertHandlers({ show: showAlert, hide: hideAlert }), [hideAlert, showAlert]);

  const value = useMemo(
    () => ({
      showAlert,
      hideAlert,
      showError,
      showSuccess,
      showWarning,
      showInfo,
    }),
    [hideAlert, showAlert, showError, showInfo, showSuccess, showWarning],
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AppAlert
        visible={Boolean(alertState)}
        title={alertState?.title}
        message={alertState?.message}
        tone={alertState?.tone}
        actions={alertState?.actions}
        dismissible={alertState?.dismissible}
        onRequestClose={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used inside AlertProvider");
  return ctx;
}
