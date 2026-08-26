"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/app/filter-select";
import type {
  OperationKind,
  OperationPriority,
} from "@/features/operations/types";

export type PriorityFilter = "all" | OperationPriority;
export type KindFilter = "all" | OperationKind;

export function OperationsToolbar({
  query,
  priority,
  kind,
  onQueryChange,
  onPriorityChange,
  onKindChange,
  onClear,
}: {
  query: string;
  priority: PriorityFilter;
  kind: KindFilter;
  onQueryChange: (value: string) => void;
  onPriorityChange: (value: PriorityFilter) => void;
  onKindChange: (value: KindFilter) => void;
  onClear: () => void;
}) {
  const hasFilters = Boolean(query || priority !== "all" || kind !== "all");

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
          placeholder="Search operations or repositories"
          aria-label="Search repository operations"
          className="h-9 pl-9"
        />
      </div>
      <FilterSelect
        label="Priority"
        className="lg:w-48"
        value={priority}
        onChange={(value) => onPriorityChange(value as PriorityFilter)}
        options={[
          ["all", "All priorities"],
          ["high", "High priority"],
          ["medium", "Medium priority"],
          ["low", "Low priority"],
        ]}
      />
      <FilterSelect
        label="Operation type"
        className="lg:w-48"
        value={kind}
        onChange={(value) => onKindChange(value as KindFilter)}
        options={[
          ["all", "All operation types"],
          ["review", "Review requests"],
          ["issue", "Assigned issues"],
          ["pull-request", "Your pull requests"],
          ["workflow", "Workflow failures"],
          ["notification", "Notifications"],
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
