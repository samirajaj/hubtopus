import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { RepositoryHealthCenter } from "@/features/repository-health/components/health-center";
import { GitHubApiError } from "@/lib/github/errors";
import { getRepositoryHealthCenterData } from "@/features/workspace/server/workspace-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Repository Health Center | Hubtopus",
  description: "Private, explainable GitHub repository maintenance findings.",
  robots: { index: false, follow: false },
};

export default async function RepositoryHealthPage() {
  const result = await loadHealthData();
  if (!result.data) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
          <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
            Repository health
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {result.reason === "missing-session"
              ? "Connect GitHub to inspect repositories"
              : "Repository health is temporarily unavailable"}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            {result.reason === "rate-limit"
              ? "GitHub is currently rate limiting this session."
              : "Reconnect GitHub and confirm that the token can read repository metadata."}
          </p>
          <ButtonLink />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader username={result.data.user.login} />
      <RepositoryHealthCenter data={result.data} />
    </div>
  );
}

async function loadHealthData() {
  try {
    const data = await getRepositoryHealthCenterData();
    return data
      ? ({ data, reason: null } as const)
      : ({ data: null, reason: "missing-session" } as const);
  } catch (error) {
    return {
      data: null,
      reason:
        error instanceof GitHubApiError && error.kind === "rate-limit"
          ? ("rate-limit" as const)
          : ("unavailable" as const),
    };
  }
}

function ButtonLink() {
  return (
    <a
      href="/connect"
      className="bg-primary text-primary-foreground mt-6 inline-flex h-9 w-fit items-center justify-center rounded-md px-3 text-sm font-medium"
    >
      Connect GitHub
    </a>
  );
}
