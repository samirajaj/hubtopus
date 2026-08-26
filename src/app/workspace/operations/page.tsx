import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { RepositoryOperationsCenter } from "@/components/repository-operations-center";
import { GitHubApiError } from "@/lib/github";
import { getWorkspaceData } from "@/lib/github-workspace";
import { buildRepositoryOperations } from "@/lib/repository-operations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Repository Operations | Hubtopus",
  description: "A private, prioritized queue of live GitHub repository work.",
  robots: { index: false, follow: false },
};

export default async function RepositoryOperationsPage() {
  const result = await loadOperationsData();
  if (!result.data) {
    return <OperationsUnavailable reason={result.reason} />;
  }

  return (
    <div className="min-h-screen">
      <AppHeader username={result.data.username} />
      <RepositoryOperationsCenter data={result.data.operations} />
    </div>
  );
}

async function loadOperationsData() {
  try {
    const workspace = await getWorkspaceData();
    return workspace
      ? ({
          data: {
            username: workspace.user.login,
            operations: buildRepositoryOperations(workspace),
          },
          reason: null,
        } as const)
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

function OperationsUnavailable({
  reason,
}: {
  reason: "missing-session" | "rate-limit" | "unavailable";
}) {
  const content = {
    "missing-session": {
      title: "Connect GitHub to open repository operations",
      message:
        "Hubtopus needs a valid encrypted cookie session before it can load private work queues.",
    },
    "rate-limit": {
      title: "GitHub is temporarily limiting requests",
      message:
        "The session is still connected. Open repository operations again after the rate limit resets.",
    },
    unavailable: {
      title: "Repository operations are temporarily unavailable",
      message:
        "Reconnect GitHub and confirm that the token can read repositories, issues, pull requests, and actions.",
    },
  }[reason];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
          Repository operations
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{content.title}</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {content.message}
        </p>
        <a
          href="/connect"
          className="bg-primary text-primary-foreground mt-6 inline-flex h-9 w-fit items-center justify-center rounded-md px-3 text-sm font-medium"
        >
          Connect GitHub
        </a>
      </main>
    </div>
  );
}
