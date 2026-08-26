"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/app/filter-select";
import type {
  HealthSeverity,
  RepositoryHealthRecord,
} from "@/features/repository-health/types";

export type StatusFilter = "all" | RepositoryHealthRecord["status"];
export type SeverityFilter = "all" | HealthSeverity;
export type VisibilityFilter = "all" | "public" | "private";

export function HealthToolbar({
  query,
  status,
  severity,
  visibility,
  onQueryChange,
  onStatusChange,
  onSeverityChange,
  onVisibilityChange,
  onClear,
}: {
  query: string;
  status: StatusFilter;
  severity: SeverityFilter;
  visibility: VisibilityFilter;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSeverityChange: (value: SeverityFilter) => void;
  onVisibilityChange: (value: VisibilityFilter) => void;
  onClear: () => void;
}) {
  const hasFilters = Boolean(
    query || status !== "all" || severity !== "all" || visibility !== "all",
  );

  return (
    <div className="flex flex-col gap-2 lg:flex-row">
      <div className="relative min-w-0 flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search repositories or findings"
          aria-label="Search repository health findings"
          className="h-9 pl-9"
        />
      </div>
      <FilterSelect
        label="Status"
        className="lg:w-40"
        value={status}
        onChange={(value) => onStatusChange(value as StatusFilter)}
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
        onChange={(value) => onSeverityChange(value as SeverityFilter)}
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
        onChange={(value) => onVisibilityChange(value as VisibilityFilter)}
        options={[
          ["all", "All visibility"],
          ["public", "Public"],
          ["private", "Private"],
        ]}
      />
      {hasFilters ? (
        <Button variant="ghost" size="lg" onClick={onClear} className="h-9">
          <X aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
