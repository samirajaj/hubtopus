"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitFork,
  Search,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Repository } from "@/lib/github";

const PAGE_SIZE = 8;
type SortKey = "stars" | "updated" | "name";

export function RepositoryBrowser({
  repositories,
}: {
  repositories: Repository[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("stars");
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
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="repositories-heading" className="text-lg font-semibold">
            Public repositories
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse all {repositories.length.toLocaleString()} repositories
            returned by GitHub
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              placeholder="Filter repositories"
              aria-label="Filter repositories"
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortKey);
              resetPage();
            }}
          >
            <SelectTrigger
              className="h-9 w-full sm:w-44"
              aria-label="Sort repositories"
            >
              <ArrowUpDown
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="stars">Most starred</SelectItem>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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

      {filtered.length > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              aria-label="Previous repository page"
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
              aria-label="Next repository page"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
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
