import "server-only";

import { z } from "zod";

const API_ROOT = "https://api.github.com";
const REVALIDATE_SECONDS = 900;
const REPOSITORY_ANALYSIS_LIMIT = 3;

const userSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.url(),
  html_url: z.url(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  blog: z.string(),
  public_repos: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
  following: z.number().int().nonnegative(),
  created_at: z.string(),
});

const repositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.url(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  open_issues_count: z.number().int().nonnegative(),
  fork: z.boolean(),
  archived: z.boolean(),
  topics: z.array(z.string()).optional().default([]),
  default_branch: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string().nullable(),
});

const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created_at: z.string().nullable(),
  repo: z.object({ name: z.string() }),
  payload: z.record(z.string(), z.unknown()),
});

const organizationSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.url(),
  html_url: z.url(),
  description: z.string().nullable(),
});

const contributionSearchSchema = z.object({
  total_count: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.number(),
      number: z.number().int().positive(),
      title: z.string(),
      html_url: z.url(),
      repository_url: z.url(),
      state: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
      comments: z.number().int().nonnegative(),
      pull_request: z
        .object({
          merged_at: z.string().nullable().optional(),
        })
        .passthrough(),
    }),
  ),
});

const communityProfileSchema = z.object({
  health_percentage: z.number().min(0).max(100),
  files: z.object({
    code_of_conduct: z.unknown().nullable().optional(),
    contributing: z.unknown().nullable().optional(),
    issue_template: z.unknown().nullable().optional(),
    pull_request_template: z.unknown().nullable().optional(),
    readme: z.unknown().nullable().optional(),
    license: z.unknown().nullable().optional(),
  }),
});

const releaseSchema = z.object({
  id: z.number(),
  tag_name: z.string(),
  name: z.string().nullable(),
  html_url: z.url(),
  published_at: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
});

export type DeveloperProfile = {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  website: string | null;
  publicRepositories: number;
  followers: number;
  following: number;
  createdAt: string;
};

export type Repository = {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isFork: boolean;
  isArchived: boolean;
  topics: string[];
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
};

export type ActivityItem = {
  id: string;
  type: string;
  description: string;
  repository: string;
  repositoryUrl: string;
  createdAt: string;
};

export type Organization = {
  id: number;
  login: string;
  avatarUrl: string;
  url: string;
  description: string | null;
};

export type ExternalContribution = {
  id: number;
  number: number;
  title: string;
  url: string;
  repository: string;
  state: "open" | "closed" | "merged";
  comments: number;
  createdAt: string;
  updatedAt: string;
};

export type RepositoryHealth = {
  score: number;
  hasReadme: boolean;
  hasLicense: boolean;
  hasContributingGuide: boolean;
  hasCodeOfConduct: boolean;
  hasIssueTemplate: boolean;
  hasPullRequestTemplate: boolean;
};

export type RepositoryRelease = {
  id: number;
  tagName: string;
  name: string | null;
  url: string;
  publishedAt: string | null;
  isPrerelease: boolean;
};

export type OptionalDataStatus = "ready" | "rate-limit" | "unavailable";

export type OptionalData<T> = {
  status: OptionalDataStatus;
  data: T;
};

export type RepositoryInsight = {
  repositoryId: number;
  health: OptionalData<RepositoryHealth | null>;
  latestRelease: OptionalData<RepositoryRelease | null>;
};

export type DeveloperSummary = {
  analyzedAt: string;
  profile: DeveloperProfile;
  repositories: Repository[];
};

export type DeveloperData = DeveloperSummary & {
  activity: OptionalData<ActivityItem[]>;
  organizations: OptionalData<Organization[]>;
  recentStars: OptionalData<Repository[]>;
  externalContributions: OptionalData<{
    totalCount: number;
    items: ExternalContribution[];
  }>;
  repositoryInsights: RepositoryInsight[];
};

export type GitHubErrorKind = "not-found" | "rate-limit" | "unavailable";

export class GitHubApiError extends Error {
  constructor(
    public readonly kind: GitHubErrorKind,
    message: string,
    public readonly resetAt?: Date,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

function githubHeaders(accept = "application/vnd.github+json"): HeadersInit {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Hubtopus",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubRequest(
  path: string,
  options: { allowNotFound?: boolean; accept?: string } = {},
): Promise<unknown | null> {
  let response: Response;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: githubHeaders(options.accept),
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch {
    throw new GitHubApiError(
      "unavailable",
      "Hubtopus could not connect to GitHub's API.",
    );
  }

  if (response.ok) {
    if (response.status === 204) return null;
    return response.json();
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  const retryAfter = response.headers.get("retry-after");
  if (
    response.status === 429 ||
    (response.status === 403 && (remaining === "0" || retryAfter))
  ) {
    const reset = response.headers.get("x-ratelimit-reset");
    const resetAt = reset
      ? new Date(Number(reset) * 1000)
      : retryAfter
        ? new Date(Date.now() + Number(retryAfter) * 1000)
        : undefined;
    throw new GitHubApiError(
      "rate-limit",
      "GitHub's API rate limit has been reached.",
      resetAt,
    );
  }

  if (response.status === 404 && options.allowNotFound) return null;
  if (response.status === 404) {
    throw new GitHubApiError("not-found", "That GitHub user was not found.");
  }

  throw new GitHubApiError(
    "unavailable",
    `GitHub returned an unexpected ${response.status} response.`,
  );
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

function normalizeWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).toString();
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return null;
    }
  }
}

function transformProfile(user: z.infer<typeof userSchema>): DeveloperProfile {
  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    website: normalizeWebsite(user.blog),
    publicRepositories: user.public_repos,
    followers: user.followers,
    following: user.following,
    createdAt: user.created_at,
  };
}

function transformRepository(
  repository: z.infer<typeof repositorySchema>,
): Repository {
  return {
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    url: repository.html_url,
    description: repository.description,
    language: repository.language,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues: repository.open_issues_count,
    isFork: repository.fork,
    isArchived: repository.archived,
    topics: repository.topics,
    defaultBranch: repository.default_branch,
    createdAt: repository.created_at,
    updatedAt: repository.updated_at,
    pushedAt: repository.pushed_at,
  };
}

function getString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  return typeof payload[key] === "string" ? payload[key] : null;
}

function getObject(
  payload: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const value = payload[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function describeEvent(event: z.infer<typeof eventSchema>): string | null {
  const payload = event.payload;

  switch (event.type) {
    case "PushEvent": {
      const size = typeof payload.size === "number" ? payload.size : null;
      return size === null
        ? "Pushed commits"
        : `Pushed ${size} ${size === 1 ? "commit" : "commits"}`;
    }
    case "CreateEvent": {
      const refType = getString(payload, "ref_type");
      return refType ? `Created a ${refType}` : "Created something new";
    }
    case "ForkEvent":
      return "Forked the repository";
    case "WatchEvent":
      return "Starred the repository";
    case "IssuesEvent": {
      const action = getString(payload, "action");
      return action ? `${capitalize(action)} an issue` : "Worked on an issue";
    }
    case "PullRequestEvent": {
      const action = getString(payload, "action");
      return action
        ? `${capitalize(action)} a pull request`
        : "Worked on a pull request";
    }
    case "ReleaseEvent": {
      const action = getString(payload, "action");
      const release = getObject(payload, "release");
      const tag = release ? getString(release, "tag_name") : null;
      return `${action === "published" ? "Published" : "Updated"} a release${tag ? ` (${tag})` : ""}`;
    }
    case "PublicEvent":
      return "Made the repository public";
    case "IssueCommentEvent":
      return "Commented on an issue or pull request";
    default:
      return null;
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function fetchProfile(username: string): Promise<DeveloperProfile> {
  const rawUser = await githubRequest(`/users/${encodeURIComponent(username)}`);
  const user = parseExternal(userSchema, rawUser, "profile data");
  return transformProfile(user);
}

async function fetchRepositories(
  profile: DeveloperProfile,
): Promise<Repository[]> {
  const pageCount = Math.ceil(profile.publicRepositories / 100);
  const rawPages = await fetchRepositoryPages(profile.login, pageCount);
  const repositories = parseExternal(
    z.array(repositorySchema),
    rawPages.flat(),
    "repository data",
  );
  return repositories.map(transformRepository);
}

export async function getDeveloperSummary(
  username: string,
): Promise<DeveloperSummary> {
  const profile = await fetchProfile(username);
  const repositories = await fetchRepositories(profile);
  return { analyzedAt: new Date().toISOString(), profile, repositories };
}

export async function getDeveloperData(
  username: string,
): Promise<DeveloperData> {
  const profile = await fetchProfile(username);
  const encodedUsername = encodeURIComponent(profile.login);
  const repositoriesPromise = fetchRepositories(profile);
  const activityPromise = loadOptional(async () => {
    const raw = await githubRequest(
      `/users/${encodedUsername}/events/public?per_page=30`,
    );
    return transformEvents(
      parseExternal(z.array(eventSchema), raw, "event data"),
    );
  }, []);
  const organizationsPromise = loadOptional(async () => {
    const raw = await githubRequest(
      `/users/${encodedUsername}/orgs?per_page=100`,
    );
    return parseExternal(
      z.array(organizationSchema),
      raw,
      "organization data",
    ).map((organization) => ({
      id: organization.id,
      login: organization.login,
      avatarUrl: organization.avatar_url,
      url: organization.html_url,
      description: organization.description,
    }));
  }, []);
  const starsPromise = loadOptional(async () => {
    const raw = await githubRequest(
      `/users/${encodedUsername}/starred?sort=created&direction=desc&per_page=100`,
    );
    return parseExternal(
      z.array(repositorySchema),
      raw,
      "starred repository data",
    ).map(transformRepository);
  }, []);
  const contributionsPromise = loadOptional(
    () => fetchExternalContributions(profile.login),
    { totalCount: 0, items: [] },
  );

  const [
    repositories,
    activity,
    organizations,
    recentStars,
    externalContributions,
  ] = await Promise.all([
    repositoriesPromise,
    activityPromise,
    organizationsPromise,
    starsPromise,
    contributionsPromise,
  ]);

  const sourceRepositories = [...repositories]
    .filter((repository) => !repository.isFork && !repository.isArchived)
    .sort(
      (left, right) =>
        right.stars - left.stars ||
        right.forks - left.forks ||
        dateValue(right.pushedAt ?? right.updatedAt) -
          dateValue(left.pushedAt ?? left.updatedAt),
    )
    .slice(0, REPOSITORY_ANALYSIS_LIMIT);

  const repositoryInsights = await Promise.all(
    sourceRepositories.map(fetchRepositoryInsight),
  );

  return {
    analyzedAt: new Date().toISOString(),
    profile,
    repositories,
    activity,
    organizations,
    recentStars,
    externalContributions,
    repositoryInsights,
  };
}

async function fetchExternalContributions(
  username: string,
): Promise<{ totalCount: number; items: ExternalContribution[] }> {
  const query = encodeURIComponent(
    `author:${username} type:pr is:public -user:${username}`,
  );
  const raw = await githubRequest(
    `/search/issues?q=${query}&sort=updated&order=desc&per_page=30`,
  );
  const result = parseExternal(
    contributionSearchSchema,
    raw,
    "pull request search data",
  );

  return {
    totalCount: result.total_count,
    items: result.items.map((item) => {
      const repository = new URL(item.repository_url).pathname
        .replace(/^\/repos\//, "")
        .replace(/^\//, "");
      const mergedAt = item.pull_request.merged_at ?? null;
      return {
        id: item.id,
        number: item.number,
        title: item.title,
        url: item.html_url,
        repository,
        state: mergedAt ? "merged" : item.state === "open" ? "open" : "closed",
        comments: item.comments,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    }),
  };
}

async function fetchRepositoryInsight(
  repository: Repository,
): Promise<RepositoryInsight> {
  const path = `/repos/${repository.fullName}`;
  const [health, latestRelease] = await Promise.all([
    loadOptional(async () => {
      const raw = await githubRequest(`${path}/community/profile`, {
        allowNotFound: true,
      });
      if (raw === null) return null;
      const profile = parseExternal(
        communityProfileSchema,
        raw,
        "community profile data",
      );
      return {
        score: profile.health_percentage,
        hasReadme: Boolean(profile.files.readme),
        hasLicense: Boolean(profile.files.license),
        hasContributingGuide: Boolean(profile.files.contributing),
        hasCodeOfConduct: Boolean(profile.files.code_of_conduct),
        hasIssueTemplate: Boolean(profile.files.issue_template),
        hasPullRequestTemplate: Boolean(profile.files.pull_request_template),
      };
    }, null),
    loadOptional(async () => {
      const raw = await githubRequest(`${path}/releases/latest`, {
        allowNotFound: true,
      });
      if (raw === null) return null;
      const release = parseExternal(releaseSchema, raw, "release data");
      return {
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        url: release.html_url,
        publishedAt: release.published_at,
        isPrerelease: release.prerelease,
      };
    }, null),
  ]);

  return {
    repositoryId: repository.id,
    health,
    latestRelease,
  };
}

function transformEvents(
  events: z.infer<typeof eventSchema>[],
): ActivityItem[] {
  return events.flatMap((event): ActivityItem[] => {
    const description = describeEvent(event);
    if (!description || !event.created_at) return [];

    return [
      {
        id: event.id,
        type: event.type,
        description,
        repository: event.repo.name,
        repositoryUrl: `https://github.com/${event.repo.name}`,
        createdAt: event.created_at,
      },
    ];
  });
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

async function fetchRepositoryPages(
  username: string,
  pageCount: number,
): Promise<unknown[]> {
  const pages: unknown[] = [];
  const batchSize = 5;

  for (let start = 1; start <= pageCount; start += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, pageCount - start + 1) },
      (_, index) =>
        githubRequest(
          `/users/${encodeURIComponent(username)}/repos?type=public&sort=updated&per_page=100&page=${start + index}`,
        ),
    );
    pages.push(...(await Promise.all(batch)));
  }

  return pages;
}

function dateValue(value: string): number {
  return new Date(value).getTime();
}
