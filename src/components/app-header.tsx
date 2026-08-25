import Link from "next/link";
import { GitCompareArrows, PanelsTopLeft } from "lucide-react";

import { Brand } from "@/components/brand";
import { DeveloperSearch } from "@/components/developer-search";
import { ModeToggle } from "@/components/mode-toggle";

export function AppHeader({ username }: { username?: string }) {
  return (
    <header className="print-hidden bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Brand className="shrink-0 [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        {username ? (
          <DeveloperSearch
            compact
            defaultValue={username}
            className="mx-auto max-w-xl"
          />
        ) : (
          <div className="flex-1" />
        )}
        <Link
          href="/workspace"
          className="hover:bg-muted focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none md:w-auto md:gap-2 md:px-2.5"
          aria-label="Private workspace"
          title="Private workspace"
        >
          <PanelsTopLeft className="size-4" aria-hidden="true" />
          <span className="hidden md:inline">Workspace</span>
        </Link>
        <Link
          href="/compare"
          className="hover:bg-muted focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none md:w-auto md:gap-2 md:px-2.5"
          aria-label="Compare developers"
          title="Compare developers"
        >
          <GitCompareArrows className="size-4" aria-hidden="true" />
          <span className="hidden md:inline">Compare</span>
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}
