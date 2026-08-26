import { LanguageBreakdown } from "@/features/developer/components/language-breakdown";
import { RepositoryBrowser } from "@/features/developer/components/repository-browser";
import { DeveloperActivity } from "@/features/developer/components/developer-activity";
import { DeveloperProfileHeader } from "@/features/developer/components/developer-profile-header";
import { PortfolioBrief } from "@/features/developer/components/portfolio-brief";
import { RepositoryHighlights } from "@/features/developer/components/repository-highlights";
import type { DeveloperData } from "@/features/developer/types";

export function DeveloperDashboard({ data }: { data: DeveloperData }) {
  const { profile, repositories } = data;
  const sourceRepositories = repositories.filter(
    (repository) => !repository.isFork,
  );
  const totalStars = repositories.reduce(
    (sum, repository) => sum + repository.stars,
    0,
  );
  const totalForks = repositories.reduce(
    (sum, repository) => sum + repository.forks,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <DeveloperProfileHeader profile={profile} totalStars={totalStars} />
      <PortfolioBrief data={data} />

      {repositories.length ? (
        <>
          <LanguageBreakdown repositories={repositories} />
          <RepositoryHighlights
            repositories={sourceRepositories}
            totalForks={totalForks}
          />
          <RepositoryBrowser repositories={repositories} />
        </>
      ) : (
        <section
          className="my-8 border-y py-12 text-center"
          aria-labelledby="no-repositories-heading"
        >
          <h2 id="no-repositories-heading" className="text-lg font-semibold">
            No public repositories
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
            This profile is available, but GitHub does not currently list any
            public repositories for it.
          </p>
        </section>
      )}

      <DeveloperActivity data={data} />
    </main>
  );
}
