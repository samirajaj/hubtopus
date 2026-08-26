import type {
  PullRequestReviewState,
  PullRequestReviewSummary,
} from "@/features/operations/types";

type Review = {
  user: { login: string } | null;
  state: string;
};

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
