import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-4">
      {/* Page title skeleton */}
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-[200px]" />
      </div>

      {/* Filters skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>

      {/* Vehicle selection skeleton */}
      <Skeleton className="h-[200px] rounded-lg" />

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[350px] rounded-lg" />
        <Skeleton className="h-[350px] rounded-lg" />
        <Skeleton className="h-[350px] rounded-lg lg:col-span-2" />
      </div>
    </div>
  );
}
