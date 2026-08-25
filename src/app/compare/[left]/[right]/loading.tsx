import { AppHeader } from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingComparison() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-10 grid grid-cols-[1fr_5rem_1fr] items-center gap-3 border-y py-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="mx-auto h-4 w-8" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-4 py-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}
