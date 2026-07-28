import { useEffect, useId } from "react";
import { Button } from "./Button";

const SIZE_CLASS = {
  sm: "modal-card--sm",
  md: "modal-card--md",
  lg: "modal-card--lg",
  xl: "modal-card--xl",
  full: "modal-card--full",
};

/**
 * Shared admin create/edit form modal chrome.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {import('react').ReactNode} props.title
 * @param {string} [props.titleId]
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [props.size]
 * @param {() => void} props.onClose
 * @param {import('react').ReactNode} props.children
 * @param {import('react').ReactNode} [props.footer]
 * @param {boolean} [props.closeOnBackdrop=true]
 */
export function FormModal({
  open,
  title,
  titleId,
  size = "md",
  onClose,
  children,
  footer,
  closeOnBackdrop = true,
}) {
  const autoId = useId();
  const headingId = titleId || `form-modal-title-${autoId}`;
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onClick={(event) => {
        if (!closeOnBackdrop) return;
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className={`modal-card modal-card--form ${sizeClass}`.trim()}>
        <div className="modal-header">
          <h3 id={headingId}>{title}</h3>
          <Button type="button" variant="ghost" tone="cancel" onClick={onClose} aria-label="Close">
            ×
          </Button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
