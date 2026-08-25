import { AlertCircle, Clock3, SearchX } from "lucide-react";

import { DeveloperSearch } from "@/components/developer-search";
import type { GitHubErrorKind } from "@/lib/github";

export function GitHubErrorState({
  kind,
  username,
  resetAt,
}: {
  kind: GitHubErrorKind;
  username: string;
  resetAt?: Date;
}) {
  const copy = {
    "not-found": {
      icon: SearchX,
      title: "Developer not found",
      description: `GitHub does not have a public profile for @${username}. Check the spelling and try another username.`,
    },
    "rate-limit": {
      icon: Clock3,
      title: "GitHub rate limit reached",
      description: resetAt
        ? `GitHub should accept requests again after ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(resetAt)}.`
        : "GitHub is temporarily refusing additional requests. Try again shortly.",
    },
    unavailable: {
      icon: AlertCircle,
      title: "GitHub data is unavailable",
      description:
        "Hubtopus could not retrieve this profile right now. The service may be temporarily unavailable.",
    },
  }[kind];
  const Icon = copy.icon;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <span className="bg-muted flex size-12 items-center justify-center rounded-lg border">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold">{copy.title}</h1>
      <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-6">
        {copy.description}
      </p>
      <DeveloperSearch className="mt-7 max-w-xl" />
    </main>
  );
}
