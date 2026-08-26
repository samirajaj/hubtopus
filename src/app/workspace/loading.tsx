import { AppHeader } from "@/components/app/app-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 border-b pb-8">
          <Skeleton className="size-16 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="bg-border mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-none" />
          ))}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full rounded-md" />
          ))}
        </div>
      </main>
    </div>
  );
}
