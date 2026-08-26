import type { DeveloperSummary } from "@/features/developer/types";

export function buildComparisonFacts(summary: DeveloperSummary) {
  const sources = summary.repositories.filter(
    (repository) => !repository.isFork,
  );
  const activeCutoff =
    new Date(summary.analyzedAt).getTime() - 365 * 24 * 60 * 60 * 1000;
  const languageCounts = new Map<string, number>();

  sources.forEach((repository) => {
    if (repository.language) {
      languageCounts.set(
        repository.language,
        (languageCounts.get(repository.language) ?? 0) + 1,
      );
    }
  });

  const primaryLanguage =
    [...languageCounts.entries()].sort(
      (left, right) => right[1] - left[1],
    )[0]?.[0] ?? null;
  const topRepository =
    [...sources].sort(
      (left, right) => right.stars - left.stars || right.forks - left.forks,
    )[0] ?? null;
  const latestPush =
    [...sources]
      .map((repository) => repository.pushedAt ?? repository.updatedAt)
      .sort(
        (left, right) => new Date(right).getTime() - new Date(left).getTime(),
      )[0] ?? null;

  return {
    sourceRepositories: sources.length,
    activeSourceRepositories: sources.filter(
      (repository) =>
        new Date(repository.pushedAt ?? repository.updatedAt).getTime() >=
        activeCutoff,
    ).length,
    totalStars: summary.repositories.reduce(
      (sum, repository) => sum + repository.stars,
      0,
    ),
    totalForks: summary.repositories.reduce(
      (sum, repository) => sum + repository.forks,
      0,
    ),
    primaryLanguage,
    topRepository,
    latestPush,
  };
}

export function formatComparisonNumber(value: number): string {
  return value.toLocaleString();
}

export function formatComparisonDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
