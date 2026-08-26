import type { OptionalDataStatus } from "@/lib/github";
import type { PullRequestInsight } from "@/lib/github-pull-requests";
import type {
  WorkspaceData,
  WorkspaceNotification,
  WorkflowFailure,
} from "@/lib/github-workspace";

const DAY_IN_MILLISECONDS = 86_400_000;
const STALE_ISSUE_DAYS = 30;
const STALE_PULL_REQUEST_DAYS = 14;

export type OperationPriority = "high" | "medium" | "low";
export type OperationKind =
  | "review"
  | "issue"
  | "pull-request"
  | "workflow"
  | "notification";

export type RepositoryOperation = {
  id: string;
  priority: OperationPriority;
  kind: OperationKind;
  title: string;
  detail: string;
  action: string;
  repository: string;
  url: string;
  updatedAt: string;
  pullRequest?: PullRequestInsight;
};

export type RepositoryOperationsData = {
  analyzedAt: string;
  connectionMethod: WorkspaceData["connection"]["method"];
  items: RepositoryOperation[];
  workflowInspectionLimit: number;
  pullRequestInspectionLimit: number;
  coverage: {
    workQueues: OptionalDataStatus;
    pullRequests: OptionalDataStatus;
    reviews: OptionalDataStatus;
    checks: OptionalDataStatus;
    workflows: OptionalDataStatus;
    notifications: OptionalDataStatus;
  };
};

export function buildRepositoryOperations(
  data: WorkspaceData,
): RepositoryOperationsData {
  const referenceTime = new Date(data.analyzedAt).getTime();
  const insights = new Map(
    data.pullRequestInsights.data.map((insight) => [
      pullRequestKey(insight.repository, insight.number),
      insight,
    ]),
  );
  const items = [
    ...buildReviewOperations(data, insights),
    ...buildWorkflowOperations(data.workflowFailures.data),
    ...buildAssignedIssueOperations(data, referenceTime),
    ...buildPullRequestOperations(data, referenceTime, insights),
    ...buildNotificationOperations(data.notifications.data),
  ];

  return {
    analyzedAt: data.analyzedAt,
    connectionMethod: data.connection.method,
    items: deduplicateOperations(items).sort(compareOperations),
    workflowInspectionLimit: data.workflowInspectionLimit,
    pullRequestInspectionLimit: data.pullRequestInspectionLimit,
    coverage: {
      workQueues: combineStatuses([
        data.reviewRequests.status,
        data.assignedIssues.status,
        data.authoredPullRequests.status,
      ]),
      pullRequests: data.pullRequestInsights.status,
      reviews: combineStatuses(
        data.pullRequestInsights.data.map((insight) => insight.review.status),
      ),
      checks: combineStatuses(
        data.pullRequestInsights.data.map((insight) => insight.checks.status),
      ),
      workflows: data.workflowFailures.status,
      notifications: data.notifications.status,
    },
  };
}

function buildReviewOperations(
  data: WorkspaceData,
  insights: Map<string, PullRequestInsight>,
): RepositoryOperation[] {
  return data.reviewRequests.data.items.map((item) => {
    const pullRequest = insights.get(
      pullRequestKey(item.repository, item.number),
    );
    return {
      id: `review:${item.id}`,
      priority: "high",
      kind: "review",
      title: item.title,
      detail: `Your review is requested on ${item.repository} #${item.number}.`,
      action: "Review pull request",
      repository: item.repository,
      url: item.url,
      updatedAt: item.updatedAt,
      pullRequest,
    };
  });
}

function buildAssignedIssueOperations(
  data: WorkspaceData,
  referenceTime: number,
): RepositoryOperation[] {
  return data.assignedIssues.data.items.map((item) => {
    const age = ageInDays(item.updatedAt, referenceTime);
    return {
      id: `issue:${item.id}`,
      priority: age >= STALE_ISSUE_DAYS ? "high" : "medium",
      kind: "issue",
      title: item.title,
      detail: `Assigned issue ${item.repository} #${item.number}.`,
      action: "Open issue",
      repository: item.repository,
      url: item.url,
      updatedAt: item.updatedAt,
    };
  });
}

function buildPullRequestOperations(
  data: WorkspaceData,
  referenceTime: number,
  insights: Map<string, PullRequestInsight>,
): RepositoryOperation[] {
  return data.authoredPullRequests.data.items.map((item) => {
    const age = ageInDays(item.updatedAt, referenceTime);
    const isStale = age >= STALE_PULL_REQUEST_DAYS;
    const pullRequest = insights.get(
      pullRequestKey(item.repository, item.number),
    );
    return {
      id: `pull-request:${item.id}`,
      priority: pullRequestPriority(pullRequest, isStale),
      kind: "pull-request",
      title: item.title,
      detail: isStale
        ? `Your open pull request ${item.repository} #${item.number} has had no activity for ${age} days.`
        : `Your open pull request ${item.repository} #${item.number}.`,
      action: "Open pull request",
      repository: item.repository,
      url: item.url,
      updatedAt: item.updatedAt,
      pullRequest,
    };
  });
}

function pullRequestPriority(
  insight: PullRequestInsight | undefined,
  isStale: boolean,
): OperationPriority {
  if (
    insight?.mergeability === "conflicting" ||
    insight?.review.data.state === "changes-requested" ||
    Boolean(insight?.checks.data.failed)
  ) {
    return "high";
  }
  if (
    isStale ||
    insight?.review.data.state === "waiting-review" ||
    Boolean(insight?.checks.data.pending)
  ) {
    return "medium";
  }
  return "low";
}

function buildWorkflowOperations(
  failures: WorkflowFailure[],
): RepositoryOperation[] {
  return failures.map((failure) => ({
    id: `workflow:${failure.id}`,
    priority: "high",
    kind: "workflow",
    title: failure.title,
    detail: `${failure.name} failed${failure.branch ? ` on ${failure.branch}` : ""}.`,
    action: "Inspect failed run",
    repository: failure.repository,
    url: failure.url,
    updatedAt: failure.updatedAt,
  }));
}

function buildNotificationOperations(
  notifications: WorkspaceNotification[],
): RepositoryOperation[] {
  return notifications.map((notification) => ({
    id: `notification:${notification.id}`,
    priority: notificationPriority(notification.reason),
    kind: "notification",
    title: notification.title,
    detail: `Unread ${formatReason(notification.reason)} notification in ${notification.repository}.`,
    action: "Open notification",
    repository: notification.repository,
    url: notification.url,
    updatedAt: notification.updatedAt,
  }));
}

function notificationPriority(reason: string): OperationPriority {
  if (reason === "security_alert" || reason === "review_requested") {
    return "high";
  }
  if (
    reason === "assign" ||
    reason === "ci_activity" ||
    reason === "mention" ||
    reason === "team_mention"
  ) {
    return "medium";
  }
  return "low";
}

function deduplicateOperations(
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

function pullRequestKey(repository: string, number: number): string {
  return `${repository.toLowerCase()}#${number}`;
}

function combineStatuses(statuses: OptionalDataStatus[]): OptionalDataStatus {
  if (statuses.every((status) => status === "ready")) return "ready";
  if (statuses.some((status) => status === "rate-limit")) return "rate-limit";
  return "unavailable";
}

function compareOperations(
  left: RepositoryOperation,
  right: RepositoryOperation,
): number {
  return (
    operationPriorityRank(right.priority) -
      operationPriorityRank(left.priority) ||
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function operationPriorityRank(priority: OperationPriority): number {
  return { high: 3, medium: 2, low: 1 }[priority];
}

function ageInDays(value: string, referenceTime: number): number {
  return Math.max(
    0,
    Math.floor(
      (referenceTime - new Date(value).getTime()) / DAY_IN_MILLISECONDS,
    ),
  );
}

function formatReason(value: string): string {
  return value.replaceAll("_", " ");
}
