"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/workspace/filter-select";
import { SummaryFact } from "@/components/workspace/summary-fact";
import { formatDate } from "@/lib/date";
import type { RepositoryHealthCenterData } from "@/lib/github-workspace";
import {
  buildRepositoryHealthRecords,
  severityRank,
  type HealthSeverity,
  type RepositoryHealthRecord,
} from "@/lib/repository-health";

const PAGE_SIZE = 12;
type StatusFilter = "all" | RepositoryHealthRecord["status"];
type SeverityFilter = "all" | HealthSeverity;
type VisibilityFilter = "all" | "public" | "private";

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
        <div className="mt-6 flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium">Workflow coverage is limited</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              Repository metadata findings are complete, but the token could not
              provide recent GitHub Actions status.
            </p>
          </div>
        </div>
      ) : null}

      <section className="mt-10" aria-labelledby="health-results-heading">
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
                placeholder="Search repositories or findings"
                aria-label="Search repository health findings"
                className="h-9 pl-9"
              />
            </div>
            <FilterSelect
              label="Status"
              className="lg:w-40"
              value={status}
              onChange={(value) =>
                updateFilter(() => setStatus(value as StatusFilter))
              }
              options={[
                ["all", "All statuses"],
                ["attention", "Needs attention"],
                ["healthy", "No findings"],
                ["archived", "Archived"],
              ]}
            />
            <FilterSelect
              label="Severity"
              className="lg:w-40"
              value={severity}
              onChange={(value) =>
                updateFilter(() => setSeverity(value as SeverityFilter))
              }
              options={[
                ["all", "All severities"],
                ["high", "High"],
                ["medium", "Medium"],
                ["low", "Low"],
              ]}
            />
            <FilterSelect
              label="Visibility"
              className="lg:w-40"
              value={visibility}
              onChange={(value) =>
                updateFilter(() => setVisibility(value as VisibilityFilter))
              }
              options={[
                ["all", "All visibility"],
                ["public", "Public"],
                ["private", "Private"],
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
                aria-label="Previous health results page"
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
                aria-label="Next health results page"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
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

function RepositoryHealthItem({ record }: { record: RepositoryHealthRecord }) {
  const repository = record.repository;
  return (
    <article className="rounded-md border">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              className="focus-visible:ring-ring inline-flex min-w-0 items-center gap-1 rounded-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="truncate">{repository.fullName}</span>
              <ArrowUpRight
                className="text-muted-foreground size-3.5 shrink-0"
                aria-hidden="true"
              />
            </a>
            <Badge variant="outline" className="capitalize">
              {repository.visibility}
            </Badge>
            {repository.isFork ? <Badge variant="secondary">Fork</Badge> : null}
            {record.status === "archived" ? (
              <Badge variant="secondary">Archived</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {repository.description ?? "No repository description"}
          </p>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs">
          {repository.language ?? "No language"} - {record.findings.length}{" "}
          {record.findings.length === 1 ? "finding" : "findings"}
        </p>
      </div>

      {record.findings.length ? (
        <div className="divide-y border-t">
          {record.findings.map((finding) => (
            <div
              key={finding.id}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:px-5"
            >
              <SeverityBadge severity={finding.severity} />
              <div>
                <h3 className="text-sm font-medium">{finding.title}</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  {finding.detail}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={finding.url} target="_blank" rel="noreferrer">
                  {finding.action}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2 border-t px-4 py-4 text-sm sm:px-5">
          <CheckCircle2
            className="size-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          {record.status === "archived"
            ? "Archived repositories are excluded from maintenance findings."
            : "No configured maintenance findings detected."}
        </div>
      )}
    </article>
  );
}

function SeverityBadge({ severity }: { severity: HealthSeverity }) {
  const classes = {
    high: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    medium:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    low: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  }[severity];
  return (
    <span
      className={
        "inline-flex h-5 w-fit items-center rounded-full border px-2 text-xs font-medium capitalize " +
        classes
      }
    >
      {severity}
    </span>
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
