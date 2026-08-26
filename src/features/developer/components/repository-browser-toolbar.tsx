"use client";

import { ArrowUpDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/number";

export type RepositorySort = "stars" | "updated" | "name";

export function RepositoryBrowserToolbar({
  repositoryCount,
  query,
  sort,
  onQueryChange,
  onSortChange,
}: {
  repositoryCount: number;
  query: string;
  sort: RepositorySort;
  onQueryChange: (value: string) => void;
  onSortChange: (value: RepositorySort) => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 id="repositories-heading" className="text-lg font-semibold">
          Public repositories
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse all {formatNumber(repositoryCount)} repositories returned by
          GitHub
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
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Filter repositories"
            aria-label="Filter repositories"
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(value) => onSortChange(value as RepositorySort)}
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
  );
}
