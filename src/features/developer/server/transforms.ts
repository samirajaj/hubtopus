import type { z } from "zod";

import {
  eventSchema,
  repositorySchema,
  userSchema,
} from "@/features/developer/server/schemas";
import type {
  ActivityItem,
  DeveloperProfile,
  Repository,
} from "@/features/developer/types";

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

export function transformProfile(
  user: z.infer<typeof userSchema>,
): DeveloperProfile {
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

export function transformRepository(
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

export function transformEvents(
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
