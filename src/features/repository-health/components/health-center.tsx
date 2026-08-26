"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { AvailabilityNotice } from "@/components/app/availability-notice";
import { PaginationControls } from "@/components/app/pagination-controls";
import { SummaryFact } from "@/components/app/summary-fact";
import {
  HealthToolbar,
  type SeverityFilter,
  type StatusFilter,
  type VisibilityFilter,
} from "@/features/repository-health/components/health-toolbar";
import { RepositoryHealthItem } from "@/features/repository-health/components/repository-health-item";
import {
  buildRepositoryHealthRecords,
  severityRank,
} from "@/features/repository-health/domain/build-health-records";
import type { RepositoryHealthRecord } from "@/features/repository-health/types";
import type { RepositoryHealthCenterData } from "@/features/workspace/types";
import { formatDate } from "@/lib/date";

const PAGE_SIZE = 12;

export function RepositoryHealthCenter({
  data,
}: {
  data: RepositoryHealthCenterData;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [page, setPage] = useState(1);
  const records = useMemo(() => buildRepositoryHealthRecords(data), [data]);
  const summary = useMemo(() => summarize(records), [records]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records
      .filter((record) => {
        if (status !== "all" && record.status !== status) return false;
        if (
          severity !== "all" &&
          !record.findings.some((finding) => finding.severity === severity)
        ) {
          return false;
        }
        if (
          visibility !== "all" &&
          record.repository.isPrivate !== (visibility === "private")
        ) {
          return false;
        }
        if (!normalizedQuery) return true;
        const repository = record.repository;
        return [
          repository.fullName,
          repository.description ?? "",
          repository.language ?? "",
          ...repository.topics,
          ...record.findings.map((finding) => finding.title),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort(compareRecords);
  }, [query, records, severity, status, visibility]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const hasFilters =
    query || status !== "all" || severity !== "all" || visibility !== "all";

  function updateFilter(update: () => void) {
    update();
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setSeverity("all");
    setVisibility("all");
    setPage(1);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="border-b pb-8">
        <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
          Private workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          Repository health center
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
          Explainable maintenance findings from repository metadata and recent
          workflow status. Hubtopus does not combine these signals into a score.
        </p>
      </header>

      <section
        className="bg-border mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border lg:grid-cols-4"
        aria-label="Repository health summary"
      >
        <SummaryFact label="Needs attention" value={summary.attention} />
        <SummaryFact label="High priority" value={summary.high} />
        <SummaryFact label="No findings" value={summary.healthy} />
        <SummaryFact label="Archived" value={summary.archived} />
      </section>

      {data.workflowFailures.status !== "ready" ? (
        <AvailabilityNotice
          status={data.workflowFailures.status}
          title="Workflow coverage is limited"
          detail="Repository metadata findings are complete, but the token could not provide recent GitHub Actions status."
          className="mt-6"
        />
      ) : null}

      <section className="mt-10" aria-labelledby="health-results-heading">
        <div className="mb-5 flex flex-col gap-4">
          <HealthToolbar
            query={query}
            status={status}
            severity={severity}
            visibility={visibility}
            onQueryChange={(value) => updateFilter(() => setQuery(value))}
            onStatusChange={(value) => updateFilter(() => setStatus(value))}
            onSeverityChange={(value) => updateFilter(() => setSeverity(value))}
            onVisibilityChange={(value) =>
              updateFilter(() => setVisibility(value))
            }
            onClear={clearFilters}
          />
          <div className="flex items-center justify-between gap-4">
            <h2 id="health-results-heading" className="text-sm font-semibold">
              {filtered.length.toLocaleString()} repositories
            </h2>
            <p className="text-muted-foreground text-xs">
              Snapshot {formatDate(data.analyzedAt)}
            </p>
          </div>
        </div>

        {visible.length ? (
          <div className="space-y-3">
            {visible.map((record) => (
              <RepositoryHealthItem
                key={record.repository.id}
                record={record}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground border-y py-12 text-center text-sm">
            No repositories match the selected filters.
          </div>
        )}

        <PaginationControls
          page={safePage}
          totalPages={totalPages}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          itemLabel="health results"
        />
      </section>

      <p className="text-muted-foreground mt-8 flex items-start gap-2 border-t pt-5 text-xs leading-5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Repository metadata covers {data.repositories.length.toLocaleString()}
        {data.repositoriesTruncated ? "+" : ""} accessible repositories. Latest
        workflow status is intentionally limited to{" "}
        {data.workflowInspectionLimit} maintainable source repositories per
        request.
      </p>
    </main>
  );
}

function summarize(records: RepositoryHealthRecord[]) {
  return {
    attention: records.filter((record) => record.status === "attention").length,
    healthy: records.filter((record) => record.status === "healthy").length,
    archived: records.filter((record) => record.status === "archived").length,
    high: records.filter((record) =>
      record.findings.some((finding) => finding.severity === "high"),
    ).length,
  };
}

function compareRecords(
  left: RepositoryHealthRecord,
  right: RepositoryHealthRecord,
) {
  const leftSeverity = Math.max(
    0,
    ...left.findings.map((finding) => severityRank(finding.severity)),
  );
  const rightSeverity = Math.max(
    0,
    ...right.findings.map((finding) => severityRank(finding.severity)),
  );
  return (
    rightSeverity - leftSeverity ||
    right.findings.length - left.findings.length ||
    left.repository.fullName.localeCompare(right.repository.fullName)
  );
}
