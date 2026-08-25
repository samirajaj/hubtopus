import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { DeveloperDashboard } from "@/components/developer-dashboard";
import { GitHubErrorState } from "@/components/github-error-state";
import { getDeveloperData, GitHubApiError } from "@/lib/github";
import { normalizeGitHubUsername } from "@/lib/username";

type DeveloperPageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: DeveloperPageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | Hubtopus`,
    description: `Explore @${username}'s public GitHub profile, repositories, languages, stars, and recent activity.`,
  };
}

export default async function DeveloperPage({ params }: DeveloperPageProps) {
  const route = await params;
  const username = normalizeGitHubUsername(route.username);

  if (!username) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <GitHubErrorState kind="not-found" username={route.username} />
      </div>
    );
  }

  const result = await getDeveloperData(username).then(
    (data) => ({ data, error: null }),
    (error: unknown) => ({ data: null, error }),
  );

  if (result.data) {
    return (
      <div className="min-h-screen">
        <AppHeader username={result.data.profile.login} />
        <DeveloperDashboard data={result.data} />
      </div>
    );
  }

  if (result.error instanceof GitHubApiError) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader username={username} />
        <GitHubErrorState
          kind={result.error.kind}
          username={username}
          resetAt={result.error.resetAt}
        />
      </div>
    );
  }

  throw result.error;
}
