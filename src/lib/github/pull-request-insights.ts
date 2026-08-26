import "server-only";

import { z } from "zod";

import { GitHubApiError } from "@/lib/github/errors";
import type {
  PullRequestCheckSummary,
  PullRequestInsight,
  PullRequestTarget,
} from "@/lib/github/models";
import { parseGitHubResponse } from "@/lib/github/parse";
import {
  checkRunsSchema,
  pullRequestDetailSchema,
  pullRequestReviewSchema,
} from "@/lib/github/pull-request-schemas";
import {
  summarizeCheckRuns,
  summarizePullRequestReviews,
} from "@/lib/github/pull-request-summary";
import { loadRemote } from "@/lib/github/result";

export const PULL_REQUEST_INSPECTION_LIMIT = 10;
const INSPECTION_CONCURRENCY = 3;

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
  const detail = parseGitHubResponse(
    pullRequestDetailSchema,
    await request(path),
    "pull request detail data",
  );
  const requestedReviewers = [
    ...detail.requested_reviewers.map((reviewer) => reviewer.login),
    ...detail.requested_teams.map((team) => `@${team.slug}`),
  ];
  const [review, checks] = await Promise.all([
    loadRemote(async () => {
      const reviews = parseGitHubResponse(
        z.array(pullRequestReviewSchema),
        await request(`${path}/reviews?per_page=100`),
        "pull request review data",
      );
      return summarizePullRequestReviews(
        reviews,
        detail.draft,
        requestedReviewers,
      );
    }),
    loadRemote(() =>
      fetchPullRequestChecks(request, target.repository, detail.head.sha),
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

async function fetchPullRequestChecks(
  request: GitHubRequest,
  repository: string,
  headSha: string,
): Promise<PullRequestCheckSummary> {
  const result = parseGitHubResponse(
    checkRunsSchema,
    await request(
      `${repositoryApiPath(repository)}/commits/${encodeURIComponent(headSha)}/check-runs?filter=latest&per_page=100`,
    ),
    "check run data",
  );
  return summarizeCheckRuns(result.check_runs);
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
      results[index] = await mapper(values[index]!);
    }
  }

  const workerCount = Math.min(concurrency, values.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
