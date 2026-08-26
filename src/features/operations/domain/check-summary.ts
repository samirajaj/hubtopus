import type { PullRequestCheckSummary } from "@/features/operations/types";

const FAILED_CHECK_CONCLUSIONS = new Set([
  "action_required",
  "cancelled",
  "failure",
  "stale",
  "startup_failure",
  "timed_out",
]);

type CheckRun = {
  html_url: string;
  status: string;
  conclusion: string | null;
};

export function summarizeCheckRuns(
  checkRuns: CheckRun[],
): PullRequestCheckSummary {
  const failedRuns = checkRuns.filter((run) =>
    FAILED_CHECK_CONCLUSIONS.has(run.conclusion ?? ""),
  );
  const pending = checkRuns.filter(
    (run) => run.status !== "completed" || run.conclusion === null,
  ).length;
  const successful = checkRuns.filter(
    (run) => run.status === "completed" && run.conclusion === "success",
  ).length;

  return {
    total: checkRuns.length,
    failed: failedRuns.length,
    pending,
    successful,
    other: checkRuns.length - failedRuns.length - pending - successful,
    firstFailureUrl: failedRuns[0]?.html_url ?? null,
  };
}
