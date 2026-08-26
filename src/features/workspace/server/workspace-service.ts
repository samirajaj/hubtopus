import "server-only";

import { authenticatedUserSchema } from "@/features/workspace/server/schemas";
import { authenticatedRequest } from "@/features/workspace/server/github-client";
import { fetchRepositories } from "@/features/workspace/server/repository-service";
import {
  fetchNotifications,
  fetchWorkflowFailures,
  searchWork,
  selectPullRequestTargets,
  WORKFLOW_REPOSITORY_LIMIT,
} from "@/features/workspace/server/work-service";
import type {
  RepositoryHealthCenterData,
  WorkspaceData,
} from "@/features/workspace/types";
import { parseGitHubResponse } from "@/lib/github/parse";
import {
  PULL_REQUEST_INSPECTION_LIMIT,
  fetchPullRequestInsights,
} from "@/lib/github/pull-request-insights";
import { readGitHubSession } from "@/lib/github-session";
import { loadRemote, remoteDataOr } from "@/lib/github/result";

export async function getWorkspaceData(): Promise<WorkspaceData | null> {
  const context = await loadAuthenticatedContext();
  if (!context) return null;
  const { session, user } = context;

  const repositoriesPromise = fetchRepositories(session.token);
  const assignedIssuesPromise = loadRemote(() =>
    searchWork(session.token, "is:open is:issue assignee:@me archived:false"),
  );
  const reviewRequestsPromise = loadRemote(() =>
    searchWork(
      session.token,
      "is:open is:pr review-requested:@me archived:false",
    ),
  );
  const authoredPullRequestsPromise = loadRemote(() =>
    searchWork(session.token, "is:open is:pr author:@me archived:false"),
  );
  const notificationsPromise = loadRemote(() =>
    fetchNotifications(session.token),
  );

  const [
    repositoryResult,
    assignedIssues,
    reviewRequests,
    authoredPullRequests,
    notifications,
  ] = await Promise.all([
    repositoriesPromise,
    assignedIssuesPromise,
    reviewRequestsPromise,
    authoredPullRequestsPromise,
    notificationsPromise,
  ]);

  const pullRequestTargets = selectPullRequestTargets(
    remoteDataOr(reviewRequests, { totalCount: 0, items: [] }).items,
    remoteDataOr(authoredPullRequests, { totalCount: 0, items: [] }).items,
  );
  const [workflowFailures, pullRequestInsights] = await Promise.all([
    loadRemote(() =>
      fetchWorkflowFailures(session.token, repositoryResult.repositories),
    ),
    loadRemote(() =>
      fetchPullRequestInsights(
        (path) => authenticatedRequest(session.token, path),
        pullRequestTargets,
      ),
    ),
  ]);

  return {
    analyzedAt: new Date().toISOString(),
    connection: {
      method: session.method,
      expiresAt: new Date(session.expiresAt).toISOString(),
    },
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
    },
    repositories: repositoryResult.repositories,
    repositoriesTruncated: repositoryResult.truncated,
    assignedIssues,
    reviewRequests,
    authoredPullRequests,
    notifications,
    workflowFailures,
    workflowInspectionLimit: WORKFLOW_REPOSITORY_LIMIT,
    pullRequestInsights,
    pullRequestInspectionLimit: PULL_REQUEST_INSPECTION_LIMIT,
  };
}

export async function getRepositoryHealthCenterData(): Promise<RepositoryHealthCenterData | null> {
  const context = await loadAuthenticatedContext();
  if (!context) return null;

  const repositoryResult = await fetchRepositories(context.session.token);
  const workflowFailures = await loadRemote(() =>
    fetchWorkflowFailures(context.session.token, repositoryResult.repositories),
  );

  return {
    analyzedAt: new Date().toISOString(),
    user: {
      login: context.user.login,
      name: context.user.name,
      avatarUrl: context.user.avatar_url,
      profileUrl: context.user.html_url,
    },
    repositories: repositoryResult.repositories,
    repositoriesTruncated: repositoryResult.truncated,
    workflowFailures,
    workflowInspectionLimit: WORKFLOW_REPOSITORY_LIMIT,
  };
}

async function loadAuthenticatedContext() {
  const session = await readGitHubSession();
  if (!session) return null;

  const rawUser = await authenticatedRequest(session.token, "/user");
  const user = parseGitHubResponse(
    authenticatedUserSchema,
    rawUser,
    "authenticated user data",
  );
  if (user.login.toLowerCase() !== session.login.toLowerCase()) return null;
  return { session, user };
}
