import { ArrowUpRight, GitFork, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/features/developer/components/portfolio-states";
import type { Repository } from "@/features/developer/types";

export function RepositoryHighlights({
  repositories,
  totalForks,
}: {
  repositories: Repository[];
  totalForks: number;
}) {
  const highlights = [...repositories]
    .sort((a, b) => b.stars - a.stars || b.forks - a.forks)
    .slice(0, 4);

  return (
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
          {repositories.length.toLocaleString()} source -{" "}
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
