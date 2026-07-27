export function PortalButton({
  tone = "primary",
  block = false,
  className = "",
  type = "button",
  children,
  ...rest
}) {
  const toneClass =
    tone === "success"
      ? "portal-btn--success"
      : tone === "soft"
        ? "portal-btn--soft"
        : tone === "danger-text"
          ? "portal-btn--danger-text"
          : "portal-btn--primary";

  return (
    <button
      type={type}
      className={`portal-btn ${toneClass}${block ? " portal-btn--block" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
