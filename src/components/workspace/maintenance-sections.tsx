import { CircleAlert, LockKeyhole, Workflow } from "lucide-react";

import {
  Empty,
  SectionHeading,
  Unavailable,
} from "@/components/workspace/section-state";
import { dateValue } from "@/lib/date";
import type { OptionalData } from "@/lib/github/result";
import type {
  WorkspaceData,
  WorkspaceRepository,
  WorkflowFailure,
} from "@/lib/github-workspace";

export type MaintenanceItem = {
  repository: WorkspaceRepository;
  signals: string[];
};

export function buildMaintenanceItems(data: WorkspaceData): MaintenanceItem[] {
  const staleCutoff = dateValue(data.analyzedAt) - 365 * 24 * 60 * 60 * 1000;

  return data.repositories
    .filter(
      (repository) =>
        repository.canAdminister &&
        !repository.isArchived &&
        !repository.isFork,
    )
    .map((repository) => {
      const signals: string[] = [];
      if (!repository.description) signals.push("missing description");
      if (!repository.license && !repository.isPrivate) {
        signals.push("missing license");
      }
      if (!repository.topics.length) signals.push("no topics");
      if (
        dateValue(repository.pushedAt ?? repository.updatedAt) < staleCutoff
      ) {
        signals.push("no push in 12 months");
      }
      return { repository, signals };
    })
    .filter((item) => item.signals.length)
    .sort(
      (left, right) =>
        right.signals.length - left.signals.length ||
        dateValue(right.repository.updatedAt) -
          dateValue(left.repository.updatedAt),
    );
}

export function MaintenanceSection({ items }: { items: MaintenanceItem[] }) {
  return (
    <section>
      <SectionHeading
        title="Repository maintenance"
        description="Factual gaps found in repositories you can maintain."
        icon={<CircleAlert className="size-4" aria-hidden="true" />}
        count={items.length}
      />
      {items.length ? (
        <div className="divide-y border-y">
          {items.slice(0, 8).map(({ repository, signals }) => (
            <a
              key={repository.id}
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 focus-visible:ring-ring block px-1 py-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">
                  {repository.fullName}
                </p>
                {repository.isPrivate ? (
                  <LockKeyhole
                    className="text-muted-foreground size-3.5 shrink-0"
                    aria-label="Private repository"
                  />
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {signals.join(" - ")}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <Empty message="No maintenance gaps detected in the inspected repositories." />
      )}
    </section>
  );
}

export function WorkflowSection({
  value,
}: {
  value: OptionalData<WorkflowFailure[]>;
}) {
  return (
    <section>
      <SectionHeading
        title="Latest workflow failures"
        description="Repositories whose most recent workflow run failed."
        icon={<Workflow className="size-4" aria-hidden="true" />}
        count={value.status === "ready" ? value.data.length : undefined}
      />
      {value.status !== "ready" ? (
        <Unavailable
          status={value.status}
          detail="Actions read permission is required for private repositories."
        />
      ) : value.data.length ? (
        <div className="divide-y border-y">
          {value.data.map((run) => (
            <a
              key={run.id}
              href={run.url}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 focus-visible:ring-ring block px-1 py-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              <p className="line-clamp-1 text-sm font-medium">{run.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {run.repository} - {run.name}
                {run.branch ? ` on ${run.branch}` : ""}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <Empty message="No latest-run failures found in the inspected repositories." />
      )}
    </section>
  );
}
