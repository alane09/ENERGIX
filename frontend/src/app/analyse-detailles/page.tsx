import { Suspense } from "react";
import AnalyseDetaillesClient from "./analyse-detailles-client";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
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
      <Skeleton className="h-[600px] rounded-lg" />
    </div>
  );
}

export default function AnalyseDetaillesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AnalyseDetaillesClient />
    </Suspense>
  );
}
