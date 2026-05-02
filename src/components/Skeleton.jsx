export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
      <Skeleton className="aspect-[4/5] rounded-xl" />
      <Skeleton className="mt-4 h-4 w-4/5 rounded" />
      <Skeleton className="mt-2 h-4 w-3/5 rounded" />
      <div className="mt-5 flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800 md:grid-cols-[112px_minmax(0,1fr)_auto]">
      <Skeleton className="aspect-[4/3] rounded-xl md:h-28 md:w-28" />
      <div className="min-w-0">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="mt-3 h-5 w-24 rounded" />
        <Skeleton className="mt-4 h-4 w-20 rounded" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl sm:w-36" />
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <Skeleton className="h-5 w-2/3 rounded" />
      <Skeleton className="mt-3 h-4 w-40 rounded" />
      <div className="mt-5 grid grid-cols-[64px_minmax(0,1fr)] gap-3">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div>
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="mt-3 h-4 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Skeleton({ className = "" }) {
  return (
    <div className={`skeleton-shimmer rounded-2xl bg-slate-200 dark:bg-slate-800 ${className}`} />
  );
}
