import { clsx } from 'clsx';

export default function Card({ children, className, onClick, padding = true }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface/95 rounded-2xl border border-border/80 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.28)] backdrop-blur-sm',
        padding && 'p-4',
        onClick && 'active:scale-[0.99] hover:border-primary-200 transition-all cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
