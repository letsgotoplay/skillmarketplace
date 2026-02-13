interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-4 border-b">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-8 w-1/3 mb-4" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-60 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-60 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
