import { Check, PackageCheck, X } from "lucide-react";

import {
  EmptyState,
  OptionalNotice,
} from "@/features/developer/components/portfolio-states";
import type {
  DeveloperData,
  Repository,
  RepositoryHealth,
} from "@/features/developer/types";
import { formatDate } from "@/lib/date";

export function RepositoryHealthSection({ data }: { data: DeveloperData }) {
  const repositoryById = new Map(
    data.repositories.map((repository) => [repository.id, repository]),
  );

  return (
    <section
      id="health"
      className="scroll-mt-24"
      aria-labelledby="health-heading"
    >
      <div className="mb-5">
        <h2 id="health-heading" className="text-lg font-semibold">
          Repository health
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Documentation and release signals for up to three notable source
          repositories
        </p>
      </div>
      {data.repositoryInsights.length ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {data.repositoryInsights.map((insight) => {
            const repository = repositoryById.get(insight.repositoryId);
            if (!repository) return null;
            return (
              <RepositoryHealthCard
                key={repository.id}
                repository={repository}
                insight={insight}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState text="No active source repositories are available for focused analysis." />
      )}
    </section>
  );
}

function RepositoryHealthCard({
  repository,
  insight,
}: {
  repository: Repository;
  insight: DeveloperData["repositoryInsights"][number];
}) {
  return (
    <article className="bg-card rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <a
          href={repository.url}
          target="_blank"
          rel="noreferrer"
          className="focus-visible:ring-ring min-w-0 truncate rounded-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          {repository.name}
        </a>
        {insight.health.status === "ready" && insight.health.data ? (
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {insight.health.data.score}%
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Last pushed{" "}
        {formatDate(repository.pushedAt ?? repository.updatedAt)}
      </p>

      {insight.health.status === "ready" && insight.health.data ? (
        <HealthChecklist health={insight.health.data} />
      ) : insight.health.status === "ready" ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Community health data is not available.
        </p>
      ) : (
        <OptionalNotice
          status={insight.health.status}
          label="community health"
          compact
        />
      )}

      <div className="mt-4 border-t pt-3 text-xs">
        {insight.latestRelease.status === "ready" &&
        insight.latestRelease.data ? (
          <a
            href={insight.latestRelease.data.url}
            target="_blank"
            rel="noreferrer"
            className="focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            <PackageCheck
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
            {insight.latestRelease.data.tagName}
            {insight.latestRelease.data.publishedAt
              ? ` - ${formatDate(insight.latestRelease.data.publishedAt)}`
              : ""}
          </a>
        ) : insight.latestRelease.status === "ready" ? (
          <span className="text-muted-foreground">No published releases</span>
        ) : (
          <span className="text-muted-foreground">
            Release data unavailable
          </span>
        )}
      </div>
    </article>
  );
}

function HealthChecklist({ health }: { health: RepositoryHealth }) {
  const checks = [
    ["README", health.hasReadme],
    ["License", health.hasLicense],
    ["Contributing", health.hasContributingGuide],
    ["Code of conduct", health.hasCodeOfConduct],
    ["Issue template", health.hasIssueTemplate],
    ["PR template", health.hasPullRequestTemplate],
  ] as const;

  return (
    <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
      {checks.map(([label, present]) => (
        <li
          key={label}
          className="text-muted-foreground flex items-center gap-1.5"
        >
          {present ? (
            <Check className="text-primary size-3.5" aria-hidden="true" />
          ) : (
            <X className="size-3.5" aria-hidden="true" />
          )}
          {label}
          <span className="sr-only">: {present ? "present" : "missing"}</span>
        </li>
      ))}
    </ul>
  );
}
