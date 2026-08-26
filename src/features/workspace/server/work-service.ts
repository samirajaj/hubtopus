import "server-only";

import { z } from "zod";

import { authenticatedRequest } from "@/features/workspace/server/github-client";
import {
  notificationSchema,
  searchSchema,
  workflowRunsSchema,
} from "@/features/workspace/server/schemas";
import type {
  WorkItem,
  WorkspaceNotification,
  WorkspaceRepository,
  WorkflowFailure,
} from "@/features/workspace/types";
import { GitHubApiError } from "@/lib/github/errors";
import { parseGitHubResponse } from "@/lib/github/parse";
import { PULL_REQUEST_INSPECTION_LIMIT } from "@/lib/github/pull-request-insights";

export const WORKFLOW_REPOSITORY_LIMIT = 6;

export async function searchWork(
  token: string,
  query: string,
): Promise<{ totalCount: number; items: WorkItem[] }> {
  const raw = await authenticatedRequest(
    token,
    `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`,
  );
  const result = parseGitHubResponse(searchSchema, raw, "work queue data");

  return {
    totalCount: result.total_count,
    items: result.items.map((item) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      url: item.html_url,
      repository: repositoryFromApiUrl(item.repository_url),
      kind: item.pull_request ? "pull-request" : "issue",
      comments: item.comments,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
  };
}

export async function fetchNotifications(
  token: string,
): Promise<WorkspaceNotification[]> {
  const raw = await authenticatedRequest(
    token,
    "/notifications?all=false&participating=false&per_page=50",
  );
  const notifications = parseGitHubResponse(
    z.array(notificationSchema),
    raw,
    "notification data",
  );

  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.subject.title,
    url:
      apiUrlToGitHubUrl(notification.subject.url) ??
      notification.repository.html_url,
    repository: notification.repository.full_name,
    reason: notification.reason,
    type: notification.subject.type,
    unread: notification.unread,
    updatedAt: notification.updated_at,
  }));
}

export function selectPullRequestTargets(
  reviewRequests: WorkItem[],
  authoredPullRequests: WorkItem[],
): WorkItem[] {
  const unique = new Map<string, WorkItem>();
  for (const item of [...reviewRequests, ...authoredPullRequests]) {
    if (item.kind !== "pull-request") continue;
    const key = pullRequestKey(item.repository, item.number);
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()].slice(0, PULL_REQUEST_INSPECTION_LIMIT);
}

export async function fetchWorkflowFailures(
  token: string,
  repositories: WorkspaceRepository[],
): Promise<WorkflowFailure[]> {
  const targets = repositories
    .filter(
      (repository) =>
        !repository.isArchived &&
        !repository.isFork &&
        repository.canAdminister,
    )
    .slice(0, WORKFLOW_REPOSITORY_LIMIT);

  const results = await Promise.all(
    targets.map(async (repository) => {
      try {
        const raw = await authenticatedRequest(
          token,
          `/repos/${repository.fullName}/actions/runs?per_page=1`,
        );
        const runs = parseGitHubResponse(
          workflowRunsSchema,
          raw,
          "workflow run data",
        );
        const run = runs.workflow_runs[0];
        return {
          available: true as const,
          failure:
            run?.conclusion === "failure"
              ? {
                  id: run.id,
                  name: run.name ?? "Workflow",
                  title: run.display_title,
                  url: run.html_url,
                  repository: repository.fullName,
                  branch: run.head_branch,
                  updatedAt: run.updated_at,
                }
              : null,
        };
      } catch (error) {
        if (error instanceof GitHubApiError && error.kind === "rate-limit") {
          throw error;
        }
        return { available: false as const, failure: null };
      }
    }),
  );

  if (targets.length && results.every((result) => !result.available)) {
    throw new GitHubApiError(
      "unavailable",
      "The token cannot read workflow runs for the inspected repositories.",
    );
  }

  return results.flatMap((result) => (result.failure ? [result.failure] : []));
}

function repositoryFromApiUrl(value: string): string {
  return new URL(value).pathname.replace(/^\/repos\//, "").replace(/^\//, "");
}

function pullRequestKey(repository: string, number: number): string {
  return `${repository.toLowerCase()}#${number}`;
}

function apiUrlToGitHubUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const apiPath = new URL(value).pathname.replace(/^\/repos\//, "");
    if (!/\/(pulls|issues|commits)\//.test(apiPath)) return null;
    const path = apiPath
      .replace(/\/pulls\//, "/pull/")
      .replace(/\/commits\//, "/commit/");
    return `https://github.com/${path}`;
  } catch {
    return null;
  }
}
