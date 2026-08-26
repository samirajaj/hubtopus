import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { DeveloperSummary } from "@/features/developer/types";

export function DeveloperIdentity({
  summary,
  align,
}: {
  summary: DeveloperSummary;
  align: "left" | "right";
}) {
  const profile = summary.profile;
  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      <Image
        src={profile.avatarUrl}
        alt={`${profile.login}'s GitHub avatar`}
        width={64}
        height={64}
        className="size-12 shrink-0 rounded-md border sm:size-16"
      />
      <div className="min-w-0">
        <h2 className="truncate font-semibold sm:text-lg">
          {profile.name ?? profile.login}
        </h2>
        <Link
          href={`/developers/${encodeURIComponent(profile.login)}`}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex max-w-full items-center gap-1 truncate rounded-sm text-xs hover:underline focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
        >
          @{profile.login}{" "}
          <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
