import type {
  PullRequestCheckSummary,
  PullRequestReviewState,
  PullRequestReviewSummary,
} from "@/lib/github/models";

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

type Review = {
  user: { login: string } | null;
  state: string;
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

export function summarizePullRequestReviews(
  reviews: Review[],
  isDraft: boolean,
  requestedReviewers: string[],
): PullRequestReviewSummary {
  const latestDecisions = new Map<string, "APPROVED" | "CHANGES_REQUESTED">();

  for (const review of reviews) {
    if (!review.user) continue;
    if (review.state === "APPROVED" || review.state === "CHANGES_REQUESTED") {
      latestDecisions.set(review.user.login, review.state);
    } else if (review.state === "DISMISSED") {
      latestDecisions.delete(review.user.login);
    }
  }

  const approvals = [...latestDecisions.values()].filter(
    (state) => state === "APPROVED",
  ).length;
  const changesRequested = [...latestDecisions.values()].filter(
    (state) => state === "CHANGES_REQUESTED",
  ).length;
  const state: PullRequestReviewState = isDraft
    ? "draft"
    : changesRequested
      ? "changes-requested"
      : requestedReviewers.length
        ? "waiting-review"
        : approvals
          ? "approved"
          : "none";

  return { state, approvals, changesRequested, requestedReviewers };
}
