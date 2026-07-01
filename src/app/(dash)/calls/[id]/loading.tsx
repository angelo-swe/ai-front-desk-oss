import { Skeleton } from "@/components/ui/Skeleton";

export default function CallDetailLoading() {
  return (
    <div
      className="mx-auto max-w-3xl space-y-5"
      role="status"
      aria-busy="true"
      aria-label="Loading call"
    >
      <span className="sr-only">Loading call…</span>
      <Skeleton className="h-4 w-20" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
      <div className="liquid-glass space-y-3 p-5 sm:p-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="liquid-glass space-y-4 p-5 sm:p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-2/3 rounded-2xl" />
        <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
      </div>
    </div>
  );
}
