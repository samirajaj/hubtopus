import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      aria-label="Loading developer profile"
    >
      <div className="flex gap-5">
        <Skeleton className="size-24 shrink-0 sm:size-32" />
        <div className="flex-1 space-y-3 pt-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-3/4 max-w-md" />
        </div>
      </div>
      <div className="my-8 grid grid-cols-2 border-y sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-2 border-r px-4 py-5 last:border-r-0"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full" />
        ))}
      </div>
    </main>
  );
}
