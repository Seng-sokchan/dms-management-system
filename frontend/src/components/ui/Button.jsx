import { forwardRef } from "react";
import "./Button.css";

/** @typedef {'primary' | 'ghost' | 'sm'} ButtonVariant */
/** @typedef {'edit' | 'delete' | 'cancel' | 'view'} GhostTone */

const variantClass = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  sm: "btn-sm",
};

const toneClass = {
  edit: "btn-edit",
  delete: "btn-delete",
  cancel: "btn-cancel",
  view: "btn-view",
};

/**
 * @param {object} props
 * @param {ButtonVariant} [props.variant]
 * @param {GhostTone} [props.tone] — only applies when variant is "ghost"
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export const Button = forwardRef(function Button(
  {
    variant = "ghost",
    tone,
    className = "",
    type = "button",
    children,
    ...rest
  },
  ref,
) {
  const v = variantClass[variant] ?? variantClass.ghost;
  const t =
    variant === "ghost" && tone && toneClass[tone] ? toneClass[tone] : "";
  const merged = [v, t, className].filter(Boolean).join(" ");
  return (
    <button ref={ref} type={type} className={merged} {...rest}>
      {children}
    </button>
  );
});
