import { AppHeader } from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function RepositoryOperationsLoading() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main
        className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        aria-label="Loading repository operations"
      >
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-none" />
          ))}
        </div>
        <Skeleton className="mt-10 h-9 w-full" />
        <div className="mt-5 divide-y border-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-none" />
          ))}
        </div>
      </main>
    </div>
  );
}
