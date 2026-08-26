import type {
  WorkspaceData,
  WorkspaceRepository,
} from "@/features/workspace/types";
import { compareDatesDescending, isAtLeastDaysOld } from "@/lib/date";

export type MaintenanceItem = {
  repository: WorkspaceRepository;
  signals: string[];
};

export function buildMaintenanceItems(data: WorkspaceData): MaintenanceItem[] {
  return data.repositories
    .filter(
      (repository) =>
        repository.canAdminister &&
        !repository.isArchived &&
        !repository.isFork,
    )
    .map((repository) => ({
      repository,
      signals: buildMaintenanceSignals(repository, data.analyzedAt),
    }))
    .filter((item) => item.signals.length)
    .sort(
      (left, right) =>
        right.signals.length - left.signals.length ||
        compareDatesDescending(
          left.repository.updatedAt,
          right.repository.updatedAt,
        ),
    );
}

function buildMaintenanceSignals(
  repository: WorkspaceRepository,
  analyzedAt: string,
): string[] {
  const signals: string[] = [];
  if (!repository.description) signals.push("missing description");
  if (!repository.license && !repository.isPrivate) {
    signals.push("missing license");
  }
  if (!repository.topics.length) signals.push("no topics");
  if (
    isAtLeastDaysOld(
      repository.pushedAt ?? repository.updatedAt,
      analyzedAt,
      365,
    )
  ) {
    signals.push("no push in 12 months");
  }
  return signals;
}
