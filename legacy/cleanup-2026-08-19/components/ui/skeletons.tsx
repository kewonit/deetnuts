/**
 * Reusable skeleton components for loading states
 * Best Practice: Provides better perceived performance
 * Supports streaming SSR without coupling the component to a hosting provider.
 */

export function CardSkeleton() {
  return (
    <div className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white animate-pulse">
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="flex-grow space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border-4 border-black bg-white overflow-hidden">
      <div className="border-b-4 border-black bg-gray-100 p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded flex-1 animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="divide-y-2 divide-black">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-100 rounded flex-1 animate-pulse"
                  style={{ animationDelay: `${i * 100 + j * 50}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white animate-pulse">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-4/5" />
    </div>
  );
}

export function GridSkeleton({
  items = 6,
  columns = 3,
}: {
  items?: number;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for institute pages
 */
export function InstitutePageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}

/**
 * Loading skeleton for cutoffs table
 */
export function CutoffsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
