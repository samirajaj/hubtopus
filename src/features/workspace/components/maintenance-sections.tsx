import { CircleAlert, LockKeyhole, Workflow } from "lucide-react";

import {
  Empty,
  SectionHeading,
  Unavailable,
} from "@/features/workspace/components/section-state";
import type { MaintenanceItem } from "@/features/workspace/domain/maintenance";
import type { RemoteResult } from "@/lib/github/result";
import type { WorkflowFailure } from "@/features/workspace/types";

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
  value: RemoteResult<WorkflowFailure[]>;
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
