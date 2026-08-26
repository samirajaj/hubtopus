import "server-only";

import {
  communityProfileSchema,
  contributionSearchSchema,
  releaseSchema,
} from "@/features/developer/server/schemas";
import { requestPublicGitHub } from "@/features/developer/server/github-client";
import type {
  ExternalContribution,
  Repository,
  RepositoryInsight,
} from "@/features/developer/types";
import { parseGitHubResponse } from "@/lib/github/parse";
import { loadRemote } from "@/lib/github/result";

export async function fetchExternalContributions(
  username: string,
): Promise<{ totalCount: number; items: ExternalContribution[] }> {
  const query = encodeURIComponent(
    `author:${username} type:pr is:public -user:${username}`,
  );
  const raw = await requestPublicGitHub(
    `/search/issues?q=${query}&sort=updated&order=desc&per_page=30`,
  );
  const result = parseGitHubResponse(
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

export async function fetchRepositoryInsight(
  repository: Repository,
): Promise<RepositoryInsight> {
  const path = `/repos/${repository.fullName}`;
  const [health, latestRelease] = await Promise.all([
    loadRemote(async () => {
      const raw = await requestPublicGitHub(`${path}/community/profile`, {
        allowNotFound: true,
      });
      if (raw === null) return null;
      const profile = parseGitHubResponse(
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
    }),
    loadRemote(async () => {
      const raw = await requestPublicGitHub(`${path}/releases/latest`, {
        allowNotFound: true,
      });
      if (raw === null) return null;
      const release = parseGitHubResponse(releaseSchema, raw, "release data");
      return {
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        url: release.html_url,
        publishedAt: release.published_at,
        isPrerelease: release.prerelease,
      };
    }),
  ]);

  return {
    repositoryId: repository.id,
    health,
    latestRelease,
  };
}
