import type {
  PullRequestInsight,
  OperationPriority,
  RepositoryOperation,
} from "@/features/operations/types";
import type {
  WorkspaceData,
  WorkspaceNotification,
  WorkflowFailure,
} from "@/features/workspace/types";
import { remoteDataOr } from "@/lib/github/result";

const DAY_IN_MILLISECONDS = 86_400_000;
const STALE_ISSUE_DAYS = 30;
const STALE_PULL_REQUEST_DAYS = 14;

export function buildReviewOperations(
  data: WorkspaceData,
  insights: Map<string, PullRequestInsight>,
): RepositoryOperation[] {
  return remoteDataOr(data.reviewRequests, {
    totalCount: 0,
    items: [],
  }).items.map((item) => {
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

export function buildAssignedIssueOperations(
  data: WorkspaceData,
  referenceTime: number,
): RepositoryOperation[] {
  return remoteDataOr(data.assignedIssues, {
    totalCount: 0,
    items: [],
  }).items.map((item) => {
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

export function buildPullRequestOperations(
  data: WorkspaceData,
  referenceTime: number,
  insights: Map<string, PullRequestInsight>,
): RepositoryOperation[] {
  return remoteDataOr(data.authoredPullRequests, {
    totalCount: 0,
    items: [],
  }).items.map((item) => {
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
    (insight?.review.status === "ready" &&
      insight.review.data.state === "changes-requested") ||
    (insight?.checks.status === "ready" && Boolean(insight.checks.data.failed))
  ) {
    return "high";
  }
  if (
    isStale ||
    (insight?.review.status === "ready" &&
      insight.review.data.state === "waiting-review") ||
    (insight?.checks.status === "ready" && Boolean(insight.checks.data.pending))
  ) {
    return "medium";
  }
  return "low";
}

export function buildWorkflowOperations(
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

export function buildNotificationOperations(
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

export function pullRequestKey(repository: string, number: number): string {
  return `${repository.toLowerCase()}#${number}`;
}
