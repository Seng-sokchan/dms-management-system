import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import "./ConfirmProvider.css";

const ConfirmContext = createContext(null);

/**
 * @typedef {'default' | 'primary' | 'danger'} ConfirmTone
 */

/**
 * @param {object} [options]
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {string} [options.confirmLabel]
 * @param {string} [options.cancelLabel]
 * @param {ConfirmTone} [options.tone]
 * @returns {Promise<boolean>}
 */

export function ConfirmProvider({ children }) {
  const { t } = useTranslation();
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (options = {}) => {
      return new Promise((resolve) => {
        setState({
          title: options.title ?? t("confirm.defaultTitle"),
          message: options.message ?? t("confirm.defaultMessage"),
          confirmLabel: options.confirmLabel ?? t("confirm.confirm"),
          cancelLabel: options.cancelLabel ?? t("confirm.cancel"),
          tone: options.tone ?? "default",
          resolve,
        });
      });
    },
    [t],
  );

  const alert = useCallback(
    (options = {}) => {
      return new Promise((resolve) => {
        setState({
          title: options.title ?? t("confirm.defaultTitle"),
          message: options.message ?? t("confirm.defaultMessage"),
          confirmLabel: options.confirmLabel ?? t("confirm.ok"),
          cancelLabel: null,
          tone: options.tone ?? "primary",
          resolve,
          mode: "alert",
        });
      });
    },
    [t],
  );

  const finish = useCallback((value) => {
    setState((prev) => {
      if (prev?.resolve) {
        prev.resolve(value);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(state?.mode === "alert" ? true : false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [state, finish]);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {state
        ? createPortal(
            <div className="confirm-host" role="presentation">
              <div
                className="confirm-host__backdrop"
                onClick={() => finish(state.mode === "alert" ? true : false)}
                aria-hidden
              />
              <div
                className="confirm-card"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="app-confirm-title"
                aria-describedby="app-confirm-desc"
              >
                <div
                  className={`confirm-card__icon confirm-card__icon--${state.tone}`}
                  aria-hidden
                >
                  {state.tone === "danger" ? <IconWarning /> : <IconShield />}
                </div>
                <h2 id="app-confirm-title" className="confirm-card__title">
                  {state.title}
                </h2>
                <p id="app-confirm-desc" className="confirm-card__message">
                  {state.message}
                </p>
                <div className="confirm-card__actions">
                  {state.mode !== "alert" ? (
                    <Button
                      variant="ghost"
                      className="confirm-card__btn-cancel"
                      onClick={() => finish(false)}
                    >
                      {state.cancelLabel}
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    className={
                      state.tone === "danger"
                        ? "confirm-card__btn-ok confirm-card__btn-ok--danger"
                        : "confirm-card__btn-ok confirm-card__btn-ok--primary"
                    }
                    onClick={() => finish(true)}
                  >
                    {state.confirmLabel}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 3v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.2L1.7 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// Hook is intentionally exported next to its provider; fast-refresh wants hooks in separate files.
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}
