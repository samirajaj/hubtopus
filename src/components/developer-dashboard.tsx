import Image from "next/image";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ExternalLink,
  GitFork,
  Globe2,
  MapPin,
  Star,
} from "lucide-react";

import { LanguageBreakdown } from "@/components/language-breakdown";
import { RepositoryBrowser } from "@/components/repository-browser";
import { Badge } from "@/components/ui/badge";
import type { DeveloperData, Repository } from "@/lib/github";

export function DeveloperDashboard({ data }: { data: DeveloperData }) {
  const { profile, repositories, activity } = data;
  const sourceRepositories = repositories.filter(
    (repository) => !repository.isFork,
  );
  const totalStars = repositories.reduce(
    (sum, repository) => sum + repository.stars,
    0,
  );
  const totalForks = repositories.reduce(
    (sum, repository) => sum + repository.forks,
    0,
  );
  const highlights = [...sourceRepositories]
    .sort((a, b) => b.stars - a.stars || b.forks - a.forks)
    .slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section
        className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
        aria-labelledby="profile-heading"
      >
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
          <Image
            src={profile.avatarUrl}
            alt={`${profile.login}'s GitHub avatar`}
            width={144}
            height={144}
            priority
            className="bg-muted size-24 shrink-0 rounded-lg border object-cover sm:size-32"
          />
          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1
                id="profile-heading"
                className="text-2xl font-semibold sm:text-3xl"
              >
                {profile.name ?? profile.login}
              </h1>
              <span className="text-muted-foreground text-base">
                @{profile.login}
              </span>
            </div>
            {profile.bio ? (
              <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
                {profile.bio}
              </p>
            ) : null}
            <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {profile.company ? (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-4" aria-hidden="true" />{" "}
                  {profile.company}
                </span>
              ) : null}
              {profile.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" />{" "}
                  {profile.location}
                </span>
              ) : null}
              {profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground focus-visible:ring-ring inline-flex max-w-64 items-center gap-1.5 truncate rounded-sm hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Globe2 className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {displayUrl(profile.website)}
                  </span>
                  <ExternalLink
                    className="size-3 shrink-0"
                    aria-hidden="true"
                  />
                </a>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" /> Joined{" "}
                {formatMonthYear(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-background hover:bg-muted focus-visible:ring-ring inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          View on GitHub <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </section>

      <dl className="my-8 grid grid-cols-2 border-y sm:grid-cols-4">
        <Metric label="Public repos" value={profile.publicRepositories} />
        <Metric label="Followers" value={profile.followers} />
        <Metric label="Following" value={profile.following} />
        <Metric label="Stars received" value={totalStars} />
      </dl>

      {repositories.length ? (
        <>
          <LanguageBreakdown repositories={repositories} />

          <section className="py-8" aria-labelledby="highlights-heading">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 id="highlights-heading" className="text-lg font-semibold">
                  Notable repositories
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Most starred source repositories
                </p>
              </div>
              <div className="text-muted-foreground hidden text-sm sm:block">
                {sourceRepositories.length.toLocaleString()} source ·{" "}
                {totalForks.toLocaleString()} forks received
              </div>
            </div>
            {highlights.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {highlights.map((repository) => (
                  <HighlightedRepository
                    key={repository.id}
                    repository={repository}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="This developer's public repositories are all forks, so there are no source projects to highlight." />
            )}
          </section>

          <RepositoryBrowser repositories={repositories} />
        </>
      ) : (
        <section
          className="my-8 border-y py-12 text-center"
          aria-labelledby="no-repositories-heading"
        >
          <h2 id="no-repositories-heading" className="text-lg font-semibold">
            No public repositories
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
            This profile is available, but GitHub does not currently list any
            public repositories for it.
          </p>
        </section>
      )}

      <section
        id="activity"
        className="scroll-mt-24 pt-10"
        aria-labelledby="activity-heading"
      >
        <div className="mb-5">
          <h2 id="activity-heading" className="text-lg font-semibold">
            Recent public activity
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            A limited view of recent public events made available by GitHub
          </p>
        </div>
        {activity.length ? (
          <ol className="divide-y border-y">
            {activity.slice(0, 12).map((item) => (
              <li
                key={item.id}
                className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"
              >
                <p className="min-w-0 text-sm">
                  <span className="font-medium">{item.description}</span>{" "}
                  <a
                    href={item.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm hover:underline focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {item.repository}
                  </a>
                </p>
                <time
                  dateTime={item.createdAt}
                  className="text-muted-foreground text-xs sm:text-right"
                >
                  {formatDateTime(item.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState text="GitHub did not return any recent supported public activity for this developer." />
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r px-4 py-5 last:border-r-0 even:border-r-0 sm:last:border-r-0 sm:even:border-r">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function HighlightedRepository({ repository }: { repository: Repository }) {
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
        <ArrowUpRight
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden="true"
        />
      </div>
      <p className="text-muted-foreground mt-2 line-clamp-2 min-h-10 text-sm">
        {repository.description ?? "No description provided."}
      </p>
      <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
        {repository.language ? (
          <Badge variant="secondary">{repository.language}</Badge>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5" aria-hidden="true" />{" "}
          {repository.stars.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3.5" aria-hidden="true" />{" "}
          {repository.forks.toLocaleString()}
        </span>
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
      {text}
    </p>
  );
}

function displayUrl(value: string): string {
  const url = new URL(value);
  return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
}

function formatMonthYear(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
