import { clsx } from 'clsx';

const variants = {
  primary: 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-[0_10px_24px_-16px_rgba(37,99,235,0.8)] hover:from-primary-600 hover:to-primary-700 active:from-primary-700 active:to-primary-800',
  secondary: 'bg-surface-tertiary text-text-primary border border-border hover:bg-[#e6edf7] active:bg-[#dde7f4]',
  outline: 'border border-border bg-surface text-text-primary hover:bg-surface-tertiary',
  danger: 'bg-gradient-to-b from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700',
  ghost: 'text-text-secondary hover:bg-surface-tertiary',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
  full: 'w-full px-4 py-3 text-base rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-200',
        'active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      {children}
    </button>
  );
}
