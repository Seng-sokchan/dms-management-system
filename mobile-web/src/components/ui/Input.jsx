import { clsx } from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, className, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-tertiary" />
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full rounded-xl border bg-surface/95 px-4 py-2.5 text-sm shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset]',
            'outline-none transition-all placeholder:text-text-tertiary',
            'focus:border-primary-400 focus:ring-4 focus:ring-primary-100',
            error ? 'border-danger-500' : 'border-border',
            Icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
