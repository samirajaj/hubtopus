import "server-only";

import { z } from "zod";

import { GitHubApiError, type OptionalData } from "@/lib/github";

export const PULL_REQUEST_INSPECTION_LIMIT = 10;
const INSPECTION_CONCURRENCY = 3;
const FAILED_CHECK_CONCLUSIONS = new Set([
  "action_required",
  "cancelled",
  "failure",
  "stale",
  "startup_failure",
  "timed_out",
]);

const pullRequestDetailSchema = z.object({
  draft: z.boolean(),
  mergeable: z.boolean().nullable(),
  head: z.object({ sha: z.string().min(1) }),
  requested_reviewers: z
    .array(z.object({ login: z.string() }))
    .optional()
    .default([]),
  requested_teams: z
    .array(z.object({ slug: z.string() }))
    .optional()
    .default([]),
});

const pullRequestReviewSchema = z.object({
  id: z.number(),
  user: z.object({ login: z.string() }).nullable(),
  state: z.string(),
  submitted_at: z.string().nullable().optional(),
});

const checkRunsSchema = z.object({
  check_runs: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      html_url: z.url(),
      status: z.string(),
      conclusion: z.string().nullable(),
    }),
  ),
});

export type PullRequestReviewState =
  | "draft"
  | "changes-requested"
  | "waiting-review"
  | "approved"
  | "none";

export type PullRequestReviewSummary = {
  state: PullRequestReviewState;
  approvals: number;
  changesRequested: number;
  requestedReviewers: string[];
};

export type PullRequestCheckSummary = {
  total: number;
  failed: number;
  pending: number;
  successful: number;
  other: number;
  firstFailureUrl: string | null;
};

export type PullRequestInsight = {
  repository: string;
  number: number;
  isDraft: boolean;
  mergeability: "mergeable" | "conflicting" | "unknown";
  review: OptionalData<PullRequestReviewSummary>;
  checks: OptionalData<PullRequestCheckSummary>;
};

export type PullRequestTarget = {
  repository: string;
  number: number;
};

type GitHubRequest = (path: string) => Promise<unknown>;

export async function fetchPullRequestInsights(
  request: GitHubRequest,
  targets: PullRequestTarget[],
): Promise<PullRequestInsight[]> {
  const results = await mapWithConcurrency(
    targets,
    INSPECTION_CONCURRENCY,
    async (target) => {
      try {
        return await fetchPullRequestInsight(request, target);
      } catch (error) {
        if (error instanceof GitHubApiError && error.kind === "rate-limit") {
          throw error;
        }
        return null;
      }
    },
  );

  if (targets.length && results.every((result) => result === null)) {
    throw new GitHubApiError(
      "unavailable",
      "The token cannot inspect pull request details.",
    );
  }

  return results.flatMap((result) => (result ? [result] : []));
}

async function fetchPullRequestInsight(
  request: GitHubRequest,
  target: PullRequestTarget,
): Promise<PullRequestInsight> {
  const path = pullRequestApiPath(target.repository, target.number);
  const detail = parseExternal(
    pullRequestDetailSchema,
    await request(path),
    "pull request detail data",
  );
  const requestedReviewers = [
    ...detail.requested_reviewers.map((reviewer) => reviewer.login),
    ...detail.requested_teams.map((team) => `@${team.slug}`),
  ];
  const fallbackReview = summarizePullRequestReviews(
    [],
    detail.draft,
    requestedReviewers,
  );
  const [review, checks] = await Promise.all([
    loadOptional(async () => {
      const reviews = parseExternal(
        z.array(pullRequestReviewSchema),
        await request(`${path}/reviews?per_page=100`),
        "pull request review data",
      );
      return summarizePullRequestReviews(
        reviews,
        detail.draft,
        requestedReviewers,
      );
    }, fallbackReview),
    loadOptional(
      () => fetchPullRequestChecks(request, target.repository, detail.head.sha),
      emptyPullRequestChecks(),
    ),
  ]);

  return {
    repository: target.repository,
    number: target.number,
    isDraft: detail.draft,
    mergeability:
      detail.mergeable === true
        ? "mergeable"
        : detail.mergeable === false
          ? "conflicting"
          : "unknown",
    review,
    checks,
  };
}

function summarizePullRequestReviews(
  reviews: z.infer<typeof pullRequestReviewSchema>[],
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

async function fetchPullRequestChecks(
  request: GitHubRequest,
  repository: string,
  headSha: string,
): Promise<PullRequestCheckSummary> {
  const result = parseExternal(
    checkRunsSchema,
    await request(
      `${repositoryApiPath(repository)}/commits/${encodeURIComponent(headSha)}/check-runs?filter=latest&per_page=100`,
    ),
    "check run data",
  );
  const failedRuns = result.check_runs.filter((run) =>
    FAILED_CHECK_CONCLUSIONS.has(run.conclusion ?? ""),
  );
  const pending = result.check_runs.filter(
    (run) => run.status !== "completed" || run.conclusion === null,
  ).length;
  const successful = result.check_runs.filter(
    (run) => run.status === "completed" && run.conclusion === "success",
  ).length;

  return {
    total: result.check_runs.length,
    failed: failedRuns.length,
    pending,
    successful,
    other: result.check_runs.length - failedRuns.length - pending - successful,
    firstFailureUrl: failedRuns[0]?.html_url ?? null,
  };
}

function emptyPullRequestChecks(): PullRequestCheckSummary {
  return {
    total: 0,
    failed: 0,
    pending: 0,
    successful: 0,
    other: 0,
    firstFailureUrl: null,
  };
}

async function loadOptional<T>(
  loader: () => Promise<T>,
  fallback: T,
): Promise<OptionalData<T>> {
  try {
    return { status: "ready", data: await loader() };
  } catch (error) {
    return {
      status:
        error instanceof GitHubApiError && error.kind === "rate-limit"
          ? "rate-limit"
          : "unavailable",
      data: fallback,
    };
  }
}

function parseExternal<T>(
  schema: z.ZodType<T>,
  value: unknown,
  description: string,
): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new GitHubApiError(
    "unavailable",
    `GitHub returned ${description} in an unexpected format.`,
  );
}

function repositoryApiPath(repository: string): string {
  const [owner, name, extra] = repository.split("/");
  if (!owner || !name || extra) {
    throw new GitHubApiError(
      "unavailable",
      "GitHub returned an invalid repository name.",
    );
  }
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function pullRequestApiPath(repository: string, number: number): string {
  return `${repositoryApiPath(repository)}/pulls/${number}`;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  }

  const workerCount = Math.min(concurrency, values.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
