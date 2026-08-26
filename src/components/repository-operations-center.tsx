"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleX,
  ListChecks,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PullRequestInsight } from "@/lib/github-pull-requests";
import type {
  OperationKind,
  OperationPriority,
  RepositoryOperation,
  RepositoryOperationsData,
} from "@/lib/repository-operations";

const PAGE_SIZE = 15;
type PriorityFilter = "all" | OperationPriority;
type KindFilter = "all" | OperationKind;

const kindLabels: Record<OperationKind, string> = {
  review: "Review request",
  issue: "Assigned issue",
  "pull-request": "Your pull request",
  workflow: "Workflow failure",
  notification: "Notification",
};

export function RepositoryOperationsCenter({
  data,
}: {
  data: RepositoryOperationsData;
}) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [page, setPage] = useState(1);
  const summary = useMemo(() => summarize(data.items), [data.items]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.items.filter((item) => {
      if (priority !== "all" && item.priority !== priority) return false;
      if (kind !== "all" && item.kind !== kind) return false;
      if (!normalizedQuery) return true;
      return [item.title, item.detail, item.repository, kindLabels[item.kind]]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [data.items, kind, priority, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const hasFilters = query || priority !== "all" || kind !== "all";
  const hasLimitedCoverage = Object.values(data.coverage).some(
    (status) => status !== "ready",
  );

  function updateFilter(update: () => void) {
    update();
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setPriority("all");
    setKind("all");
    setPage(1);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-6 border-b pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
            Private workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Repository operations
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
            One prioritized queue with pull request mergeability, review state,
            requested reviewers, check runs, assigned issues, workflow failures,
            and compatible GitHub notifications.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/workspace">Workspace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/workspace/health">
              <ShieldCheck aria-hidden="true" />
              Health center
            </Link>
          </Button>
        </div>
      </header>

      <section
        className="bg-border mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border lg:grid-cols-4"
        aria-label="Operations summary"
      >
        <SummaryFact label="Open operations" value={data.items.length} />
        <SummaryFact label="High priority" value={summary.high} />
        <SummaryFact label="Reviews requested" value={summary.reviews} />
        <SummaryFact
          label="Pull requests inspected"
          value={summary.inspectedPullRequests}
        />
      </section>

      {hasLimitedCoverage ? <CoverageNotice data={data} /> : null}

      <section className="mt-10" aria-labelledby="operations-results-heading">
        <div className="mb-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) =>
                  updateFilter(() => setQuery(event.target.value))
                }
                placeholder="Search operations or repositories"
                aria-label="Search repository operations"
                className="h-9 pl-9"
              />
            </div>
            <FilterSelect
              label="Priority"
              value={priority}
              onChange={(value) =>
                updateFilter(() => setPriority(value as PriorityFilter))
              }
              options={[
                ["all", "All priorities"],
                ["high", "High priority"],
                ["medium", "Medium priority"],
                ["low", "Low priority"],
              ]}
            />
            <FilterSelect
              label="Operation type"
              value={kind}
              onChange={(value) =>
                updateFilter(() => setKind(value as KindFilter))
              }
              options={[
                ["all", "All operation types"],
                ["review", "Review requests"],
                ["issue", "Assigned issues"],
                ["pull-request", "Your pull requests"],
                ["workflow", "Workflow failures"],
                ["notification", "Notifications"],
              ]}
            />
            {hasFilters ? (
              <Button
                variant="ghost"
                size="lg"
                onClick={clearFilters}
                className="h-9"
              >
                <X aria-hidden="true" />
                Clear
              </Button>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-4">
            <h2
              id="operations-results-heading"
              className="text-sm font-semibold"
            >
              {filtered.length.toLocaleString()} operations
            </h2>
            <p className="text-muted-foreground text-xs">
              Live snapshot {formatDateTime(data.analyzedAt)}
            </p>
          </div>
        </div>

        {visible.length ? (
          <div className="divide-y border-y">
            {visible.map((item) => (
              <OperationItem
                key={item.id}
                item={item}
                referenceTime={data.analyzedAt}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground border-y py-12 text-center text-sm">
            {hasFilters
              ? "No operations match the selected filters."
              : "No open operations were returned by GitHub."}
          </div>
        )}

        {filtered.length > PAGE_SIZE ? (
          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
                aria-label="Previous operations page"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={safePage === totalPages}
                aria-label="Next operations page"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="text-muted-foreground mt-8 space-y-2 border-t pt-5 text-xs leading-5">
        <p className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          High priority means a requested review, latest workflow failure, pull
          request conflict, failed check, requested changes, security or review
          notification, or an assigned issue with no update for 30 days.
        </p>
        <p className="flex items-start gap-2">
          <ListChecks className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          This live snapshot uses the current encrypted cookie session and does
          not persist operation history. Workflow checks cover up to{" "}
          {data.workflowInspectionLimit} recently updated maintainable source
          repositories, and pull request intelligence covers up to{" "}
          {data.pullRequestInspectionLimit} priority pull requests per request.
        </p>
      </div>
    </main>
  );
}

function OperationItem({
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
          <Badge variant="outline">{kindLabels[item.kind]}</Badge>
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

function CoverageNotice({ data }: { data: RepositoryOperationsData }) {
  const limited = Object.entries(data.coverage)
    .filter(([, status]) => status !== "ready")
    .map(
      ([source, status]) => `${coverageLabel(source)} (${statusLabel(status)})`,
    );

  return (
    <div className="mt-6 flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      <CircleAlert
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium">Some operation sources are limited</p>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Available results are still shown. Limited sources:{" "}
          {limited.join(", ")}.
        </p>
      </div>
    </div>
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full lg:w-48" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map(([optionValue, optionLabel]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {optionLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SummaryFact({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background min-w-0 px-4 py-5 sm:px-5">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function summarize(items: RepositoryOperation[]) {
  return {
    high: items.filter((item) => item.priority === "high").length,
    reviews: items.filter((item) => item.kind === "review").length,
    inspectedPullRequests: items.filter((item) => item.pullRequest).length,
  };
}

function coverageLabel(value: string): string {
  return (
    {
      workQueues: "work queues",
      pullRequests: "pull request details",
      reviews: "pull request reviews",
      checks: "pull request checks",
      workflows: "workflow runs",
      notifications: "notifications",
    }[value] ?? value
  );
}

function statusLabel(value: string): string {
  return value === "rate-limit" ? "rate limited" : "permission unavailable";
}

function formatRelativeDate(value: string, referenceTime: string): string {
  const days = Math.max(
    0,
    Math.floor(
      (new Date(referenceTime).getTime() - new Date(value).getTime()) /
        86_400_000,
    ),
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
