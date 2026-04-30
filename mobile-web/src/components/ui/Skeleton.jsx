import { clsx } from 'clsx';

export default function Skeleton({ className, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={clsx('skeleton', className)} />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-40" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>
    </div>
  );
}
