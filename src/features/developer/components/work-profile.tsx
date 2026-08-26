import Image from "next/image";

import {
  BriefFact,
  OptionalNotice,
} from "@/features/developer/components/portfolio-states";
import type { DeveloperData } from "@/features/developer/types";

export function WorkProfile({ data }: { data: DeveloperData }) {
  const sourceRepositories = data.repositories.filter(
    (repository) => !repository.isFork,
  );
  const forks = data.repositories.length - sourceRepositories.length;
  const activeSources = sourceRepositories.filter((repository) => {
    const activityDate = repository.pushedAt ?? repository.updatedAt;
    return (
      new Date(data.analyzedAt).getTime() - new Date(activityDate).getTime() <
      365 * 24 * 60 * 60 * 1000
    );
  }).length;
  const totalStars = data.repositories.reduce(
    (sum, repository) => sum + repository.stars,
    0,
  );
  const topStars = Math.max(
    0,
    ...sourceRepositories.map((repository) => repository.stars),
  );
  const concentration = totalStars
    ? Math.round((topStars / totalStars) * 100)
    : 0;

  return (
    <section
      id="brief"
      className="scroll-mt-24"
      aria-labelledby="brief-heading"
    >
      <div className="mb-5">
        <h2 id="brief-heading" className="text-lg font-semibold">
          Portfolio brief
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Factual signals from public repositories, without a synthetic
          developer score
        </p>
      </div>
      <dl className="grid border-y sm:grid-cols-4">
        <BriefFact
          label="Original work"
          value={`${sourceRepositories.length} source repos`}
        />
        <BriefFact
          label="Active in 12 months"
          value={`${activeSources} source repos`}
        />
        <BriefFact label="Forks" value={forks.toLocaleString()} />
        <BriefFact
          label="Impact concentration"
          value={totalStars ? `${concentration}% in top repo` : "No stars yet"}
        />
      </dl>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Public organizations</h3>
        {data.organizations.status === "ready" &&
        data.organizations.data.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.organizations.data.map((organization) => (
              <li key={organization.id}>
                <a
                  href={organization.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-card hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  title={organization.description ?? organization.login}
                >
                  <Image
                    src={organization.avatarUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 rounded-sm"
                  />
                  {organization.login}
                </a>
              </li>
            ))}
          </ul>
        ) : data.organizations.status === "ready" ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No public organization memberships listed.
          </p>
        ) : (
          <OptionalNotice
            status={data.organizations.status}
            label="organization memberships"
          />
        )}
      </div>
    </section>
  );
}
