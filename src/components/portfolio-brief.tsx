import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  GitPullRequest,
  MessagesSquare,
  PackageCheck,
  Star,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  DeveloperData,
  OptionalDataStatus,
  Repository,
  RepositoryHealth,
} from "@/lib/github";

export function PortfolioBrief({ data }: { data: DeveloperData }) {
  return (
    <div className="space-y-10 py-8">
      <WorkProfile data={data} />
      <ExternalContributions data={data} />
      {data.repositories.length ? (
        <RepositoryHealthSection data={data} />
      ) : null}
      <OpenSourceInterests data={data} />
    </div>
  );
}

function WorkProfile({ data }: { data: DeveloperData }) {
  const sourceRepositories = data.repositories.filter(
    (repository) => !repository.isFork,
  );
  const forks = data.repositories.length - sourceRepositories.length;
  const activeSources = sourceRepositories.filter((repository) => {
    const activityDate = repository.pushedAt ?? repository.updatedAt;
    return (
      new Date(data.analyzedAt).getTime() - new Date(activityDate).getTime() <
      365 * 24 * 60 * 60 * 1000
    );
  }).length;
  const totalStars = data.repositories.reduce(
    (sum, repository) => sum + repository.stars,
    0,
  );
  const topStars = Math.max(
    0,
    ...sourceRepositories.map((repository) => repository.stars),
  );
  const concentration = totalStars
    ? Math.round((topStars / totalStars) * 100)
    : 0;

  return (
    <section
      id="brief"
      className="scroll-mt-24"
      aria-labelledby="brief-heading"
    >
      <div className="mb-5">
        <h2 id="brief-heading" className="text-lg font-semibold">
          Portfolio brief
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Factual signals from public repositories, without a synthetic
          developer score
        </p>
      </div>
      <dl className="grid border-y sm:grid-cols-4">
        <BriefFact
          label="Original work"
          value={`${sourceRepositories.length} source repos`}
        />
        <BriefFact
          label="Active in 12 months"
          value={`${activeSources} source repos`}
        />
        <BriefFact label="Forks" value={forks.toLocaleString()} />
        <BriefFact
          label="Impact concentration"
          value={totalStars ? `${concentration}% in top repo` : "No stars yet"}
        />
      </dl>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Public organizations</h3>
        {data.organizations.status === "ready" &&
        data.organizations.data.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.organizations.data.map((organization) => (
              <li key={organization.id}>
                <a
                  href={organization.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-card hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  title={organization.description ?? organization.login}
                >
                  <Image
                    src={organization.avatarUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 rounded-sm"
                  />
                  {organization.login}
                </a>
              </li>
            ))}
          </ul>
        ) : data.organizations.status === "ready" ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No public organization memberships listed.
          </p>
        ) : (
          <OptionalNotice
            status={data.organizations.status}
            label="organization memberships"
          />
        )}
      </div>
    </section>
  );
}

function ExternalContributions({ data }: { data: DeveloperData }) {
  const section = data.externalContributions;

  return (
    <section
      id="contributions"
      className="scroll-mt-24"
      aria-labelledby="contributions-heading"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="contributions-heading" className="text-lg font-semibold">
            External contributions
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Public pull requests authored outside repositories owned by this
            developer
          </p>
        </div>
        {section.status === "ready" && section.data.totalCount ? (
          <span className="text-sm font-medium tabular-nums">
            {section.data.totalCount.toLocaleString()} found
          </span>
        ) : null}
      </div>

      {section.status !== "ready" ? (
        <OptionalNotice
          status={section.status}
          label="external contributions"
        />
      ) : section.data.items.length ? (
        <ol className="divide-y border-y">
          {section.data.items.slice(0, 8).map((contribution) => (
            <li
              key={contribution.id}
              className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <a
                  href={contribution.url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-visible:ring-ring inline-flex max-w-full items-center gap-1.5 rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  <GitPullRequest
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{contribution.title}</span>
                  <ArrowUpRight
                    className="text-muted-foreground size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                </a>
                <p className="text-muted-foreground mt-1 text-xs">
                  {contribution.repository} #{contribution.number} - Updated{" "}
                  {formatDate(contribution.updatedAt)}
                </p>
              </div>
              <div className="text-muted-foreground flex items-center gap-3 text-xs sm:justify-end">
                {contribution.comments ? (
                  <span className="inline-flex items-center gap-1">
                    <MessagesSquare className="size-3.5" aria-hidden="true" />
                    {contribution.comments}
                  </span>
                ) : null}
                <Badge
                  variant={
                    contribution.state === "open" ? "secondary" : "outline"
                  }
                >
                  {contribution.state}
                </Badge>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState text="No public external pull requests were found by GitHub search." />
      )}
    </section>
  );
}

function RepositoryHealthSection({ data }: { data: DeveloperData }) {
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
        Last pushed {formatDate(repository.pushedAt ?? repository.updatedAt)}
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

function OpenSourceInterests({ data }: { data: DeveloperData }) {
  const section = data.recentStars;
  const topicCounts = new Map<string, number>();
  const languageCounts = new Map<string, number>();

  section.data.forEach((repository) => {
    repository.topics.forEach((topic) =>
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1),
    );
    if (repository.language) {
      languageCounts.set(
        repository.language,
        (languageCounts.get(repository.language) ?? 0) + 1,
      );
    }
  });

  const interests = [...topicCounts.entries(), ...languageCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .filter(
      ([value], index, values) =>
        values.findIndex(
          ([candidate]) => candidate.toLowerCase() === value.toLowerCase(),
        ) === index,
    )
    .slice(0, 10)
    .map(([value]) => value);

  return (
    <section
      id="interests"
      className="scroll-mt-24"
      aria-labelledby="interests-heading"
    >
      <div className="mb-5">
        <h2 id="interests-heading" className="text-lg font-semibold">
          Open-source interests
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Signals from up to 100 recently starred public repositories
        </p>
      </div>
      {section.status !== "ready" ? (
        <OptionalNotice status={section.status} label="starred repositories" />
      ) : section.data.length ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <div>
            <h3 className="text-sm font-semibold">Recurring topics</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {interests.length ? (
                interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">
                  No language or topic signals detected.
                </span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Recently starred</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {section.data.slice(0, 6).map((repository) => (
                <li key={repository.id}>
                  <a
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:bg-muted focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Star
                      className="text-muted-foreground size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">
                      {repository.fullName}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <EmptyState text="This developer has no publicly visible starred repositories." />
      )}
    </section>
  );
}

function BriefFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b px-4 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function OptionalNotice({
  status,
  label,
  compact = false,
}: {
  status: Exclude<OptionalDataStatus, "ready">;
  label: string;
  compact?: boolean;
}) {
  return (
    <p
      className={`${compact ? "mt-4 p-3" : "p-6"} text-muted-foreground rounded-md border border-dashed text-sm`}
    >
      {status === "rate-limit"
        ? `GitHub's rate limit prevented loading ${label}.`
        : `GitHub could not provide ${label} right now.`}
    </p>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
      {text}
    </p>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
