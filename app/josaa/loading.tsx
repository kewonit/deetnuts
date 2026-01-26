import {
  CutoffsTableSkeleton,
  StatsCardSkeleton,
} from "@/components/ui/skeletons";

/**
 * Loading state for JOSAA main page
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200 rounded w-96" />
        <div className="h-4 bg-gray-200 rounded w-full max-w-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="border-4 border-black bg-white p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="border-4 border-black bg-white p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
