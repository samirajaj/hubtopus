import { ArrowUpRight, GitPullRequest, MessagesSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  OptionalNotice,
} from "@/features/developer/components/portfolio-states";
import type { DeveloperData } from "@/features/developer/types";
import { formatDate } from "@/lib/date";
import { formatNumber } from "@/lib/number";

export function ExternalContributions({ data }: { data: DeveloperData }) {
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
            {formatNumber(section.data.totalCount)} found
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
