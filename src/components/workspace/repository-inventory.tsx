import { LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Empty, SectionHeading } from "@/components/workspace/section-state";
import { dateValue, formatRelativeDate } from "@/lib/date";
import type { WorkspaceRepository } from "@/lib/github-workspace";

export function RepositoryInventory({
  repositories,
  truncated,
  referenceTime,
}: {
  repositories: WorkspaceRepository[];
  truncated: boolean;
  referenceTime: number;
}) {
  const sorted = [...repositories].sort(
    (left, right) =>
      Number(right.isPrivate) - Number(left.isPrivate) ||
      dateValue(right.updatedAt) - dateValue(left.updatedAt),
  );

  return (
    <section className="mt-14">
      <SectionHeading
        title="Accessible repositories"
        description="Recently updated repositories available to the connected token."
        icon={<LockKeyhole className="size-4" aria-hidden="true" />}
        count={repositories.length}
      />
      {sorted.length ? (
        <div className="divide-y border-y">
          {sorted.slice(0, 20).map((repository) => (
            <a
              key={repository.id}
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 focus-visible:ring-ring grid gap-2 px-1 py-4 focus-visible:ring-2 focus-visible:outline-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {repository.fullName}
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {repository.visibility}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {repository.description ?? "No repository description"}
                </p>
              </div>
              <p className="text-muted-foreground text-xs sm:text-right">
                {repository.language ?? "No language"} - pushed{" "}
                {formatRelativeDate(
                  repository.pushedAt ?? repository.updatedAt,
                  referenceTime,
                )}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <Empty message="This token cannot access any repositories." />
      )}
      {repositories.length > 20 || truncated ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Showing 20 of {repositories.length.toLocaleString()}
          {truncated ? "+" : ""} accessible repositories.
        </p>
      ) : null}
    </section>
  );
}
