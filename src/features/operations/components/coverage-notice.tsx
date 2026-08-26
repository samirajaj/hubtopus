import { CircleAlert } from "lucide-react";

import type { RepositoryOperationsData } from "@/features/operations/types";

export function CoverageNotice({ limited }: { limited: string[] }) {
  return (
    <div className="mt-6 flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      <CircleAlert
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium">Some operation sources are limited</p>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Available results are still shown. Limited sources:{" "}
          {limited.join(", ")}.
        </p>
      </div>
    </div>
  );
}

export function getLimitedCoverage(data: RepositoryOperationsData): string[] {
  return Object.entries(data.coverage)
    .filter(([source, status]) => {
      if (status === "ready") return false;
      return !(
        source === "notifications" &&
        status === "unavailable" &&
        data.connectionMethod === "github-app"
      );
    })
    .map(
      ([source, status]) => `${coverageLabel(source)} (${statusLabel(status)})`,
    );
}

export function isExpectedNotificationLimitation(
  data: RepositoryOperationsData,
): boolean {
  return (
    data.connectionMethod === "github-app" &&
    data.coverage.notifications === "unavailable"
  );
}

function coverageLabel(value: string): string {
  return (
    {
      workQueues: "work queues",
      pullRequests: "pull request details",
      reviews: "pull request reviews",
      checks: "pull request checks",
      workflows: "workflow runs",
      notifications: "notifications",
    }[value] ?? value
  );
}

function statusLabel(value: string): string {
  return value === "rate-limit" ? "rate limited" : "permission unavailable";
}
