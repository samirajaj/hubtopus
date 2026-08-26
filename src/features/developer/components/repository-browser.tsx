"use client";

import { useMemo, useState } from "react";
import { ExternalLink, GitFork, Star } from "lucide-react";

import { PaginationControls } from "@/components/app/pagination-controls";
import { Badge } from "@/components/ui/badge";
import {
  RepositoryBrowserToolbar,
  type RepositorySort,
} from "@/features/developer/components/repository-browser-toolbar";
import type { Repository } from "@/features/developer/types";

const PAGE_SIZE = 8;

export function RepositoryBrowser({
  repositories,
}: {
  repositories: Repository[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<RepositorySort>("stars");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = normalizedQuery
      ? repositories.filter((repository) =>
          `${repository.name} ${repository.description ?? ""} ${repository.language ?? ""}`
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : [...repositories];

    return matches.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "updated") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return b.stars - a.stars || b.forks - a.forks;
    });
  }, [query, repositories, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function resetPage() {
    setPage(1);
  }

  return (
    <section
      id="repositories"
      className="scroll-mt-24"
      aria-labelledby="repositories-heading"
    >
      <RepositoryBrowserToolbar
        repositoryCount={repositories.length}
        query={query}
        sort={sort}
        onQueryChange={(value) => {
          setQuery(value);
          resetPage();
        }}
        onSortChange={(value) => {
          setSort(value);
          resetPage();
        }}
      />

      {visible.length ? (
        <div className="divide-y border-y">
          {visible.map((repository) => (
            <article
              key={repository.id}
              className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-visible:ring-ring inline-flex min-w-0 items-center gap-1.5 rounded-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="truncate">{repository.name}</span>
                    <ExternalLink
                      className="text-muted-foreground size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                  {repository.isFork ? (
                    <Badge variant="outline">Fork</Badge>
                  ) : null}
                  {repository.isArchived ? (
                    <Badge variant="secondary">Archived</Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-1.5 line-clamp-2 max-w-3xl text-sm">
                  {repository.description ?? "No description provided."}
                </p>
                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  {repository.language ? (
                    <span className="text-foreground font-medium">
                      {repository.language}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5" aria-hidden="true" />{" "}
                    {repository.stars.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="size-3.5" aria-hidden="true" />{" "}
                    {repository.forks.toLocaleString()}
                  </span>
                  <span>Updated {formatDate(repository.updatedAt)}</span>
                </div>
              </div>
              <div className="text-muted-foreground text-xs sm:text-right">
                {repository.openIssues.toLocaleString()} open{" "}
                {repository.openIssues === 1 ? "issue" : "issues"}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground border-y py-10 text-center text-sm">
          No repositories match your filter.
        </div>
      )}

      <PaginationControls
        page={safePage}
        totalPages={totalPages}
        onPrevious={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
        itemLabel="repository"
      />
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
