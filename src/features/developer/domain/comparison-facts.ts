import type { DeveloperSummary } from "@/features/developer/types";
import {
  compareDatesDescending,
  dateValue,
  DAY_IN_MILLISECONDS,
} from "@/lib/date";

export function buildComparisonFacts(summary: DeveloperSummary) {
  const sources = summary.repositories.filter(
    (repository) => !repository.isFork,
  );
  const activeCutoff =
    dateValue(summary.analyzedAt) - 365 * DAY_IN_MILLISECONDS;
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
      .sort(compareDatesDescending)[0] ?? null;

  return {
    sourceRepositories: sources.length,
    activeSourceRepositories: sources.filter(
      (repository) =>
        dateValue(repository.pushedAt ?? repository.updatedAt) >= activeCutoff,
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
