import "server-only";

import { z } from "zod";

import { workspaceRepositorySchema } from "@/features/workspace/server/schemas";
import { authenticatedRequest } from "@/features/workspace/server/github-client";
import type { WorkspaceRepository } from "@/features/workspace/types";
import { parseGitHubResponse } from "@/lib/github/parse";

const MAX_REPOSITORY_PAGES = 5;

export async function fetchRepositories(token: string): Promise<{
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
    const batch = parseGitHubResponse(
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
