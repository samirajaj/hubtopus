import {
  buildAssignedIssueOperations,
  buildNotificationOperations,
  buildPullRequestOperations,
  buildReviewOperations,
  buildWorkflowOperations,
  pullRequestKey,
} from "@/features/operations/domain/operation-builders";
import {
  combineStatuses,
  compareOperations,
  deduplicateOperations,
} from "@/features/operations/domain/operation-utils";
import type {
  PullRequestInsight,
  RepositoryOperationsData,
} from "@/features/operations/types";
import type { WorkspaceData } from "@/features/workspace/types";
import { remoteDataOr } from "@/lib/github/result";

export function buildRepositoryOperations(
  data: WorkspaceData,
): RepositoryOperationsData {
  const referenceTime = new Date(data.analyzedAt).getTime();
  const pullRequestInsights = remoteDataOr(data.pullRequestInsights, []);
  const insights = new Map(
    pullRequestInsights.map((insight) => [
      pullRequestKey(insight.repository, insight.number),
      insight,
    ]),
  );
  const items = [
    ...buildReviewOperations(data, insights),
    ...buildWorkflowOperations(remoteDataOr(data.workflowFailures, [])),
    ...buildAssignedIssueOperations(data, referenceTime),
    ...buildPullRequestOperations(data, referenceTime, insights),
    ...buildNotificationOperations(remoteDataOr(data.notifications, [])),
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
        pullRequestInsights.map((insight) => insight.review.status),
      ),
      checks: combineStatuses(
        pullRequestInsights.map((insight) => insight.checks.status),
      ),
      workflows: data.workflowFailures.status,
      notifications: data.notifications.status,
    },
  };
}
