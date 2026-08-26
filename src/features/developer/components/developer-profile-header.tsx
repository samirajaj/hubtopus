import Image from "next/image";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe2,
  MapPin,
} from "lucide-react";

import { BriefActions } from "@/features/developer/components/brief-actions";
import type { DeveloperProfile } from "@/features/developer/types";
import { formatMonthYear } from "@/lib/date";
import { formatNumber } from "@/lib/number";

export function DeveloperProfileHeader({
  profile,
  totalStars,
}: {
  profile: DeveloperProfile;
  totalStars: number;
}) {
  return (
    <>
      <section
        className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
        aria-labelledby="profile-heading"
      >
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
          <Image
            src={profile.avatarUrl}
            alt={`${profile.login}'s GitHub avatar`}
            width={144}
            height={144}
            priority
            className="bg-muted size-24 shrink-0 rounded-lg border object-cover sm:size-32"
          />
          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1
                id="profile-heading"
                className="text-2xl font-semibold sm:text-3xl"
              >
                {profile.name ?? profile.login}
              </h1>
              <span className="text-muted-foreground text-base">
                @{profile.login}
              </span>
            </div>
            {profile.bio ? (
              <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
                {profile.bio}
              </p>
            ) : null}
            <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {profile.company ? (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-4" aria-hidden="true" />{" "}
                  {profile.company}
                </span>
              ) : null}
              {profile.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" />{" "}
                  {profile.location}
                </span>
              ) : null}
              {profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground focus-visible:ring-ring inline-flex max-w-64 items-center gap-1.5 truncate rounded-sm hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Globe2 className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {displayUrl(profile.website)}
                  </span>
                  <ExternalLink
                    className="size-3 shrink-0"
                    aria-hidden="true"
                  />
                </a>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" /> Joined{" "}
                {formatMonthYear(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <BriefActions username={profile.login} />
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-background hover:bg-muted focus-visible:ring-ring inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            View on GitHub{" "}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <dl className="my-8 grid grid-cols-2 border-y sm:grid-cols-4">
        <Metric label="Public repos" value={profile.publicRepositories} />
        <Metric label="Followers" value={profile.followers} />
        <Metric label="Following" value={profile.following} />
        <Metric label="Stars received" value={totalStars} />
      </dl>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r px-4 py-5 last:border-r-0 even:border-r-0 sm:last:border-r-0 sm:even:border-r">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">
        {formatNumber(value)}
      </dd>
    </div>
  );
}

function displayUrl(value: string): string {
  const url = new URL(value);
  return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
}
