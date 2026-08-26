import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  HealthSeverity,
  RepositoryHealthRecord,
} from "@/features/repository-health/types";

export function RepositoryHealthItem({
  record,
}: {
  record: RepositoryHealthRecord;
}) {
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
