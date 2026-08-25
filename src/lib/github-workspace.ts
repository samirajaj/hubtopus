import "server-only";

import { z } from "zod";

import { GitHubApiError, type OptionalData } from "@/lib/github";
import { readGitHubSession } from "@/lib/github-session";

const API_ROOT = "https://api.github.com";
const MAX_REPOSITORY_PAGES = 5;
const WORKFLOW_REPOSITORY_LIMIT = 6;

const authenticatedUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.url(),
  html_url: z.url(),
});

const workspaceRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.url(),
  description: z.string().nullable(),
  private: z.boolean(),
  visibility: z.string().optional(),
  fork: z.boolean(),
  archived: z.boolean(),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  open_issues_count: z.number().int().nonnegative(),
  has_issues: z.boolean(),
  topics: z.array(z.string()).optional().default([]),
  default_branch: z.string(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
  pushed_at: z.string().nullable(),
  updated_at: z.string(),
  owner: z.object({ login: z.string() }),
  permissions: z
    .object({ admin: z.boolean(), maintain: z.boolean().optional() })
    .optional(),
});

const searchSchema = z.object({
  total_count: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.number(),
      number: z.number().int().positive(),
      title: z.string(),
      html_url: z.url(),
      repository_url: z.url(),
      state: z.string(),
      comments: z.number().int().nonnegative(),
      created_at: z.string(),
      updated_at: z.string(),
      pull_request: z.unknown().optional(),
    }),
  ),
});

const notificationSchema = z.object({
  id: z.string(),
  reason: z.string(),
  unread: z.boolean(),
  updated_at: z.string(),
  subject: z.object({
    title: z.string(),
    url: z.url().nullable(),
    type: z.string(),
  }),
  repository: z.object({
    full_name: z.string(),
    html_url: z.url(),
  }),
});

const workflowRunsSchema = z.object({
  workflow_runs: z.array(
    z.object({
      id: z.number(),
      name: z.string().nullable(),
      display_title: z.string(),
      html_url: z.url(),
      head_branch: z.string().nullable(),
      conclusion: z.string().nullable(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  ),
});

export type AuthenticatedUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
};

export type WorkspaceRepository = {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  visibility: string;
  isFork: boolean;
  isArchived: boolean;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  hasIssuesEnabled: boolean;
  topics: string[];
  defaultBranch: string;
  license: string | null;
  pushedAt: string | null;
  updatedAt: string;
  owner: string;
  canAdminister: boolean;
};

export type WorkItem = {
  id: number;
  number: number;
  title: string;
  url: string;
  repository: string;
  kind: "issue" | "pull-request";
  comments: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceNotification = {
  id: string;
  title: string;
  url: string;
  repository: string;
  reason: string;
  type: string;
  unread: boolean;
  updatedAt: string;
};

export type WorkflowFailure = {
  id: number;
  name: string;
  title: string;
  url: string;
  repository: string;
  branch: string | null;
  updatedAt: string;
};

export type WorkspaceData = {
  analyzedAt: string;
  connection: {
    method: "personal-token" | "github-app";
    expiresAt: string;
  };
  user: AuthenticatedUser;
  repositories: WorkspaceRepository[];
  repositoriesTruncated: boolean;
  assignedIssues: OptionalData<{ totalCount: number; items: WorkItem[] }>;
  reviewRequests: OptionalData<{ totalCount: number; items: WorkItem[] }>;
  authoredPullRequests: OptionalData<{
    totalCount: number;
    items: WorkItem[];
  }>;
  notifications: OptionalData<WorkspaceNotification[]>;
  workflowFailures: OptionalData<WorkflowFailure[]>;
};

export type RepositoryHealthCenterData = {
  analyzedAt: string;
  user: AuthenticatedUser;
  repositories: WorkspaceRepository[];
  repositoriesTruncated: boolean;
  workflowFailures: OptionalData<WorkflowFailure[]>;
  workflowInspectionLimit: number;
};

export async function getWorkspaceData(): Promise<WorkspaceData | null> {
  const context = await loadAuthenticatedContext();
  if (!context) return null;
  const { session, user } = context;

  const repositoriesPromise = fetchRepositories(session.token);
  const assignedIssuesPromise = loadOptional(
    () =>
      searchWork(session.token, "is:open is:issue assignee:@me archived:false"),
    { totalCount: 0, items: [] },
  );
  const reviewRequestsPromise = loadOptional(
    () =>
      searchWork(
        session.token,
        "is:open is:pr review-requested:@me archived:false",
      ),
    { totalCount: 0, items: [] },
  );
  const authoredPullRequestsPromise = loadOptional(
    () => searchWork(session.token, "is:open is:pr author:@me archived:false"),
    { totalCount: 0, items: [] },
  );
  const notificationsPromise = loadOptional(
    () => fetchNotifications(session.token),
    [],
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

  const workflowFailures = await loadOptional(
    () => fetchWorkflowFailures(session.token, repositoryResult.repositories),
    [],
  );

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
  };
}

export async function getRepositoryHealthCenterData(): Promise<RepositoryHealthCenterData | null> {
  const context = await loadAuthenticatedContext();
  if (!context) return null;

  const repositoryResult = await fetchRepositories(context.session.token);
  const workflowFailures = await loadOptional(
    () =>
      fetchWorkflowFailures(
        context.session.token,
        repositoryResult.repositories,
      ),
    [],
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
  const user = parseExternal(
    authenticatedUserSchema,
    rawUser,
    "authenticated user data",
  );
  if (user.login.toLowerCase() !== session.login.toLowerCase()) return null;
  return { session, user };
}

async function authenticatedRequest(token: string, path: string) {
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Hubtopus",
      },
      cache: "no-store",
    });
  } catch {
    throw new GitHubApiError(
      "unavailable",
      "Hubtopus could not connect to GitHub's API.",
    );
  }

  if (response.ok) return response.status === 204 ? null : response.json();

  const remaining = response.headers.get("x-ratelimit-remaining");
  const retryAfter = response.headers.get("retry-after");
  if (
    response.status === 429 ||
    (response.status === 403 && (remaining === "0" || retryAfter))
  ) {
    throw new GitHubApiError(
      "rate-limit",
      "GitHub's API rate limit has been reached.",
    );
  }

  throw new GitHubApiError(
    "unavailable",
    response.status === 401
      ? "The GitHub token is no longer valid."
      : `GitHub returned an unexpected ${response.status} response.`,
  );
}

async function fetchRepositories(token: string): Promise<{
  repositories: WorkspaceRepository[];
  truncated: boolean;
}> {
  const repositories: z.infer<typeof workspaceRepositorySchema>[] = [];
  let truncated = false;

  for (let page = 1; page <= MAX_REPOSITORY_PAGES; page += 1) {
    const raw = await authenticatedRequest(
      token,
      `/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=updated&per_page=100&page=${page}`,
    );
    const batch = parseExternal(
      z.array(workspaceRepositorySchema),
      raw,
      "repository data",
    );
    repositories.push(...batch);
    if (batch.length < 100) break;
    if (page === MAX_REPOSITORY_PAGES) truncated = true;
  }

  return {
    repositories: repositories.map((repository) => ({
      id: repository.id,
      name: repository.name,
      fullName: repository.full_name,
      url: repository.html_url,
      description: repository.description,
      isPrivate: repository.private,
      visibility:
        repository.visibility ?? (repository.private ? "private" : "public"),
      isFork: repository.fork,
      isArchived: repository.archived,
      language: repository.language,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      openIssues: repository.open_issues_count,
      hasIssuesEnabled: repository.has_issues,
      topics: repository.topics,
      defaultBranch: repository.default_branch,
      license: repository.license?.spdx_id ?? null,
      pushedAt: repository.pushed_at,
      updatedAt: repository.updated_at,
      owner: repository.owner.login,
      canAdminister: Boolean(
        repository.permissions?.admin || repository.permissions?.maintain,
      ),
    })),
    truncated,
  };
}

async function searchWork(
  token: string,
  query: string,
): Promise<{ totalCount: number; items: WorkItem[] }> {
  const raw = await authenticatedRequest(
    token,
    `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`,
  );
  const result = parseExternal(searchSchema, raw, "work queue data");

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

async function fetchNotifications(
  token: string,
): Promise<WorkspaceNotification[]> {
  const raw = await authenticatedRequest(
    token,
    "/notifications?all=false&participating=false&per_page=50",
  );
  const notifications = parseExternal(
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

async function fetchWorkflowFailures(
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
        const runs = parseExternal(
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

function repositoryFromApiUrl(value: string): string {
  return new URL(value).pathname.replace(/^\/repos\//, "").replace(/^\//, "");
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
