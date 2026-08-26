import { ArrowUpRight, CircleX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/date";
import { PullRequestSignals } from "@/features/operations/components/pull-request-signals";
import type {
  OperationKind,
  OperationPriority,
  RepositoryOperation,
} from "@/features/operations/types";

export const operationKindLabels: Record<OperationKind, string> = {
  review: "Review request",
  issue: "Assigned issue",
  "pull-request": "Your pull request",
  workflow: "Workflow failure",
  notification: "Notification",
};

export function OperationItem({
  item,
  referenceTime,
}: {
  item: RepositoryOperation;
  referenceTime: string;
}) {
  return (
    <article className="grid gap-4 px-1 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={item.priority} />
          <Badge variant="outline">{operationKindLabels[item.kind]}</Badge>
          <span className="text-muted-foreground truncate text-xs">
            {item.repository}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold">
          {item.title}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          {item.detail}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Updated {formatRelativeDate(item.updatedAt, referenceTime)}
        </p>
        {item.pullRequest ? (
          <PullRequestSignals insight={item.pullRequest} />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {item.pullRequest?.checks.status === "ready" &&
        item.pullRequest.checks.data.firstFailureUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a
              href={item.pullRequest.checks.data.firstFailureUrl}
              target="_blank"
              rel="noreferrer"
            >
              <CircleX aria-hidden="true" />
              Failed check
            </a>
          </Button>
        ) : null}
        <Button variant="outline" size="sm" asChild>
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.action}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function PriorityBadge({ priority }: { priority: OperationPriority }) {
  const classes = {
    high: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    medium:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    low: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  }[priority];
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize ${classes}`}
    >
      {priority}
    </span>
  );
}
