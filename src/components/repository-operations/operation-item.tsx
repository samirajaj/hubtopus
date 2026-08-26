import { ArrowUpRight, CircleX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/date";
import type { PullRequestInsight } from "@/lib/github-pull-requests";
import type {
  OperationKind,
  OperationPriority,
  RepositoryOperation,
} from "@/lib/repository-operations";

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
        {item.pullRequest?.checks.data.firstFailureUrl ? (
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

function PullRequestSignals({ insight }: { insight: PullRequestInsight }) {
  const review = insight.review.data;
  const checks = insight.checks.data;
  const requestedReviewers = review.requestedReviewers.join(", ");

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {insight.isDraft ? <SignalBadge label="Draft" tone="neutral" /> : null}
      <SignalBadge
        label={
          insight.mergeability === "conflicting"
            ? "Merge conflict"
            : insight.mergeability === "mergeable"
              ? "Mergeable"
              : "Mergeability pending"
        }
        tone={
          insight.mergeability === "conflicting"
            ? "danger"
            : insight.mergeability === "mergeable"
              ? "success"
              : "neutral"
        }
      />
      {insight.review.status === "ready" ? (
        <ReviewSignal review={review} />
      ) : (
        <SignalBadge
          label={
            insight.review.status === "rate-limit"
              ? "Reviews rate limited"
              : "Reviews unavailable"
          }
          tone="neutral"
        />
      )}
      {insight.checks.status === "ready" ? (
        <CheckSignals checks={checks} />
      ) : (
        <SignalBadge
          label={
            insight.checks.status === "rate-limit"
              ? "Checks rate limited"
              : "Checks unavailable"
          }
          tone="neutral"
        />
      )}
      {requestedReviewers ? (
        <span
          className="text-muted-foreground max-w-full truncate text-xs"
          title={requestedReviewers}
        >
          Requested: {requestedReviewers}
        </span>
      ) : null}
    </div>
  );
}

function ReviewSignal({
  review,
}: {
  review: PullRequestInsight["review"]["data"];
}) {
  if (review.state === "draft") return null;
  if (review.state === "changes-requested") {
    return (
      <SignalBadge
        label={`${review.changesRequested} requested changes`}
        tone="danger"
      />
    );
  }
  if (review.state === "waiting-review") {
    return <SignalBadge label="Waiting for review" tone="warning" />;
  }
  if (review.state === "approved") {
    return (
      <SignalBadge
        label={`${review.approvals} approval recorded`}
        tone="success"
      />
    );
  }
  return <SignalBadge label="No approval recorded" tone="neutral" />;
}

function CheckSignals({
  checks,
}: {
  checks: PullRequestInsight["checks"]["data"];
}) {
  if (!checks.total) {
    return <SignalBadge label="No check runs" tone="neutral" />;
  }
  return (
    <>
      {checks.failed ? (
        <SignalBadge label={`${checks.failed} failed`} tone="danger" />
      ) : null}
      {checks.pending ? (
        <SignalBadge label={`${checks.pending} pending`} tone="warning" />
      ) : null}
      {checks.successful ? (
        <SignalBadge
          label={`${checks.successful} checks passed`}
          tone="success"
        />
      ) : null}
      {checks.other ? (
        <SignalBadge label={`${checks.other} other results`} tone="neutral" />
      ) : null}
    </>
  );
}

function SignalBadge({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "warning" | "success" | "neutral";
}) {
  const classes = {
    danger: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    warning:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    success:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    neutral: "text-muted-foreground bg-muted/50",
  }[tone];

  return (
    <span
      className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
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
