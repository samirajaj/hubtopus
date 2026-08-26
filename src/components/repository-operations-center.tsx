"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ListChecks,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CoverageNotice,
  getLimitedCoverage,
  isExpectedNotificationLimitation,
} from "@/components/repository-operations/coverage-notice";
import {
  OperationItem,
  operationKindLabels,
} from "@/components/repository-operations/operation-item";
import { FilterSelect } from "@/components/workspace/filter-select";
import { SummaryFact } from "@/components/workspace/summary-fact";
import { formatDateTime } from "@/lib/date";
import { Input } from "@/components/ui/input";
import type {
  OperationKind,
  OperationPriority,
  RepositoryOperation,
  RepositoryOperationsData,
} from "@/lib/repository-operations";

const PAGE_SIZE = 15;
type PriorityFilter = "all" | OperationPriority;
type KindFilter = "all" | OperationKind;

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
      return [
        item.title,
        item.detail,
        item.repository,
        operationKindLabels[item.kind],
      ]
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
  const limitedCoverage = getLimitedCoverage(data);

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

      {limitedCoverage.length ? (
        <CoverageNotice limited={limitedCoverage} />
      ) : null}

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
              className="lg:w-48"
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
              className="lg:w-48"
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
        {isExpectedNotificationLimitation(data) ? (
          <p>
            Personal GitHub notifications are not available through GitHub App
            sessions. Other operation sources are unaffected.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function summarize(items: RepositoryOperation[]) {
  return {
    high: items.filter((item) => item.priority === "high").length,
    reviews: items.filter((item) => item.kind === "review").length,
    inspectedPullRequests: items.filter((item) => item.pullRequest).length,
  };
}
