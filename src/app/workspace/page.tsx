import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { WorkspaceDashboard } from "@/components/workspace-dashboard";
import { GitHubApiError } from "@/lib/github";
import { getWorkspaceData } from "@/lib/github-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Workspace | Hubtopus",
  description: "A private, read-only GitHub work dashboard.",
  robots: { index: false, follow: false },
};

export default async function WorkspacePage() {
  const result = await loadWorkspace();
  if (!result.data) {
    return <WorkspaceUnavailable reason={result.reason} />;
  }

  return (
    <div className="min-h-screen">
      <AppHeader username={result.data.user.login} />
      <WorkspaceDashboard data={result.data} />
    </div>
  );
}

async function loadWorkspace() {
  try {
    const data = await getWorkspaceData();
    return data
      ? ({ data, reason: null } as const)
      : ({ data: null, reason: "missing-session" } as const);
  } catch (error) {
    return {
      data: null,
      reason:
        error instanceof GitHubApiError && error.kind === "rate-limit"
          ? ("rate-limit" as const)
          : ("invalid-session" as const),
    };
  }
}

function WorkspaceUnavailable({
  reason,
}: {
  reason: "missing-session" | "invalid-session" | "rate-limit";
}) {
  const content = {
    "missing-session": {
      title: "Connect GitHub to open your workspace",
      message:
        "Your private GitHub data is available only after you connect a token.",
    },
    "invalid-session": {
      title: "Reconnect your GitHub account",
      message: "The saved token is invalid, expired, or no longer has access.",
    },
    "rate-limit": {
      title: "GitHub is temporarily limiting requests",
      message:
        "Your session is still connected. Try opening the workspace again later.",
    },
  }[reason];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
          Private workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{content.title}</h1>
        <p className="text-muted-foreground mt-3 text-sm">{content.message}</p>
        <div className="mt-6 flex gap-2">
          <a
            href="/connect"
            className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium"
          >
            Connect GitHub
          </a>
          {reason !== "missing-session" ? (
            <form action="/api/session" method="post">
              <input type="hidden" name="intent" value="disconnect" />
              <button
                type="submit"
                className="hover:bg-muted inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium"
              >
                Clear session
              </button>
            </form>
          ) : null}
        </div>
      </main>
    </div>
  );
}
