import { Skeleton } from "@/components/ui/Skeleton";

export default function OverviewLoading() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading overview">
      <span className="sr-only">Loading overview…</span>
      <div>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* hero */}
      <div className="liquid-glass flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:justify-between">
        <div className="space-y-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-16 w-56" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-9 w-60 rounded-full" />
        </div>
        <div className="w-full lg:w-[46%]">
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="liquid-glass space-y-3 p-5 sm:p-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* sentiment */}
      <div className="liquid-glass space-y-4 p-5 sm:p-6">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}
