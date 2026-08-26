import "server-only";

import { z } from "zod";

import {
  eventSchema,
  organizationSchema,
  repositorySchema,
  userSchema,
} from "@/features/developer/server/schemas";
import {
  fetchExternalContributions,
  fetchRepositoryInsight,
} from "@/features/developer/server/developer-insights";
import { requestPublicGitHub } from "@/features/developer/server/github-client";
import {
  transformEvents,
  transformProfile,
  transformRepository,
} from "@/features/developer/server/transforms";
import type {
  DeveloperData,
  DeveloperProfile,
  DeveloperSummary,
  Repository,
} from "@/features/developer/types";
import { dateValue } from "@/lib/date";
import { parseGitHubResponse } from "@/lib/github/parse";
import { loadRemote } from "@/lib/github/result";

const REPOSITORY_ANALYSIS_LIMIT = 3;

async function fetchProfile(username: string): Promise<DeveloperProfile> {
  const rawUser = await requestPublicGitHub(
    `/users/${encodeURIComponent(username)}`,
  );
  const user = parseGitHubResponse(userSchema, rawUser, "profile data");
  return transformProfile(user);
}

async function fetchRepositories(
  profile: DeveloperProfile,
): Promise<Repository[]> {
  const pageCount = Math.ceil(profile.publicRepositories / 100);
  const rawPages = await fetchRepositoryPages(profile.login, pageCount);
  const repositories = parseGitHubResponse(
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
  const activityPromise = loadRemote(async () => {
    const raw = await requestPublicGitHub(
      `/users/${encodedUsername}/events/public?per_page=30`,
    );
    return transformEvents(
      parseGitHubResponse(z.array(eventSchema), raw, "event data"),
    );
  });
  const organizationsPromise = loadRemote(async () => {
    const raw = await requestPublicGitHub(
      `/users/${encodedUsername}/orgs?per_page=100`,
    );
    return parseGitHubResponse(
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
  });
  const starsPromise = loadRemote(async () => {
    const raw = await requestPublicGitHub(
      `/users/${encodedUsername}/starred?sort=created&direction=desc&per_page=100`,
    );
    return parseGitHubResponse(
      z.array(repositorySchema),
      raw,
      "starred repository data",
    ).map(transformRepository);
  });
  const contributionsPromise = loadRemote(() =>
    fetchExternalContributions(profile.login),
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
        requestPublicGitHub(
          `/users/${encodeURIComponent(username)}/repos?type=public&sort=updated&per_page=100&page=${start + index}`,
        ),
    );
    pages.push(...(await Promise.all(batch)));
  }

  return pages;
}
