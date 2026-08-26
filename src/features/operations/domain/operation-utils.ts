import type {
  OperationPriority,
  RepositoryOperation,
} from "@/features/operations/types";
import { compareDatesDescending } from "@/lib/date";
import type { RemoteResultStatus } from "@/lib/github/result";

export function deduplicateOperations(
  operations: RepositoryOperation[],
): RepositoryOperation[] {
  const byUrl = new Map<string, RepositoryOperation>();

  for (const operation of operations) {
    const key = deduplicationKey(operation);
    const existing = byUrl.get(key);
    const preferred =
      !existing ||
      operationPriorityRank(operation.priority) >
        operationPriorityRank(existing.priority)
        ? operation
        : existing;
    const pullRequest = operation.pullRequest ?? existing?.pullRequest;
    byUrl.set(key, pullRequest ? { ...preferred, pullRequest } : preferred);
  }

  return [...byUrl.values()];
}

function deduplicationKey(operation: RepositoryOperation): string {
  const repositoryUrl = `https://github.com/${operation.repository}`;
  if (
    operation.kind === "notification" &&
    operation.url.replace(/\/$/, "") === repositoryUrl
  ) {
    return operation.id;
  }
  return operation.url;
}

export function combineStatuses(
  statuses: RemoteResultStatus[],
): RemoteResultStatus {
  if (statuses.every((status) => status === "ready")) return "ready";
  if (statuses.some((status) => status === "rate-limit")) return "rate-limit";
  return "unavailable";
}

export function compareOperations(
  left: RepositoryOperation,
  right: RepositoryOperation,
): number {
  return (
    operationPriorityRank(right.priority) -
      operationPriorityRank(left.priority) ||
    compareDatesDescending(left.updatedAt, right.updatedAt)
  );
}

function operationPriorityRank(priority: OperationPriority): number {
  return { high: 3, medium: 2, low: 1 }[priority];
}
