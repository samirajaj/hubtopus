"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CoverageNotice,
  getLimitedCoverage,
} from "@/features/operations/components/coverage-notice";
import {
  OperationItem,
  operationKindLabels,
} from "@/features/operations/components/operation-item";
import { OperationsFootnote } from "@/features/operations/components/operations-footnote";
import { PaginationControls } from "@/components/app/pagination-controls";
import { SummaryFact } from "@/components/app/summary-fact";
import { formatDateTime } from "@/lib/date";
import {
  OperationsToolbar,
  type KindFilter,
  type PriorityFilter,
} from "@/features/operations/components/operations-toolbar";
import type {
  RepositoryOperation,
  RepositoryOperationsData,
} from "@/features/operations/types";

const PAGE_SIZE = 15;
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
          <OperationsToolbar
            query={query}
            priority={priority}
            kind={kind}
            onQueryChange={(value) => updateFilter(() => setQuery(value))}
            onPriorityChange={(value) => updateFilter(() => setPriority(value))}
            onKindChange={(value) => updateFilter(() => setKind(value))}
            onClear={clearFilters}
          />
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

        <PaginationControls
          page={safePage}
          totalPages={totalPages}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          itemLabel="operations"
        />
      </section>

      <OperationsFootnote data={data} />
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
