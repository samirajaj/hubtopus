import "server-only";

import { z } from "zod";

const API_ROOT = "https://api.github.com";
const REVALIDATE_SECONDS = 900;

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
  updated_at: z.string(),
});

const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created_at: z.string().nullable(),
  repo: z.object({ name: z.string() }),
  payload: z.record(z.string(), z.unknown()),
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
  updatedAt: string;
};

export type ActivityItem = {
  id: string;
  type: string;
  description: string;
  repository: string;
  repositoryUrl: string;
  createdAt: string;
};

export type DeveloperData = {
  profile: DeveloperProfile;
  repositories: Repository[];
  activity: ActivityItem[];
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

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Hubtopus",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubRequest(path: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: githubHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch {
    throw new GitHubApiError(
      "unavailable",
      "Hubtopus could not connect to GitHub's API.",
    );
  }

  if (response.ok) return response.json();

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

  if (response.status === 404) {
    throw new GitHubApiError("not-found", "That GitHub user was not found.");
  }

  throw new GitHubApiError(
    "unavailable",
    `GitHub returned an unexpected ${response.status} response.`,
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
    updatedAt: repository.updated_at,
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

export async function getDeveloperData(
  username: string,
): Promise<DeveloperData> {
  const rawUser = await githubRequest(`/users/${encodeURIComponent(username)}`);
  const user = userSchema.safeParse(rawUser);

  if (!user.success) {
    throw new GitHubApiError(
      "unavailable",
      "GitHub returned profile data in an unexpected format.",
    );
  }

  const pageCount = Math.ceil(user.data.public_repos / 100);

  const [rawRepositoryPages, rawEvents] = await Promise.all([
    fetchRepositoryPages(user.data.login, pageCount),
    githubRequest(
      `/users/${encodeURIComponent(user.data.login)}/events/public?per_page=30`,
    ),
  ]);

  const repositoriesResult = z
    .array(repositorySchema)
    .safeParse(rawRepositoryPages.flat());
  const eventsResult = z.array(eventSchema).safeParse(rawEvents);

  if (!repositoriesResult.success || !eventsResult.success) {
    throw new GitHubApiError(
      "unavailable",
      "GitHub returned activity data in an unexpected format.",
    );
  }

  const repositories = repositoriesResult.data.map(transformRepository);
  const activity = eventsResult.data.flatMap((event): ActivityItem[] => {
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

  return {
    profile: {
      login: user.data.login,
      name: user.data.name,
      avatarUrl: user.data.avatar_url,
      profileUrl: user.data.html_url,
      bio: user.data.bio,
      company: user.data.company,
      location: user.data.location,
      website: normalizeWebsite(user.data.blog),
      publicRepositories: user.data.public_repos,
      followers: user.data.followers,
      following: user.data.following,
      createdAt: user.data.created_at,
    },
    repositories,
    activity,
  };
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
