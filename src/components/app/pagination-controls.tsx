"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext,
  itemLabel,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  itemLabel: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-4">
      <p className="text-muted-foreground text-sm">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevious}
          disabled={page === 1}
          aria-label={`Previous ${itemLabel} page`}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={page === totalPages}
          aria-label={`Next ${itemLabel} page`}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
