import { GridSkeleton, StatsCardSkeleton } from "@/components/ui/skeletons";

/**
 * Loading state for JOSAA institutes listing
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-64" />
        <div className="h-4 bg-gray-200 rounded w-full max-w-2xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <GridSkeleton items={12} columns={3} />
    </div>
  );
}
