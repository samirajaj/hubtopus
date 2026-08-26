import type { RemoteResultStatus } from "@/lib/github/result";
import type { PullRequestInsight } from "@/lib/github/models";

export type {
  PullRequestCheckSummary,
  PullRequestInsight,
  PullRequestReviewState,
  PullRequestReviewSummary,
  PullRequestTarget,
} from "@/lib/github/models";

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
  connectionMethod: "personal-token" | "github-app";
  items: RepositoryOperation[];
  workflowInspectionLimit: number;
  pullRequestInspectionLimit: number;
  coverage: {
    workQueues: RemoteResultStatus;
    pullRequests: RemoteResultStatus;
    reviews: RemoteResultStatus;
    checks: RemoteResultStatus;
    workflows: RemoteResultStatus;
    notifications: RemoteResultStatus;
  };
};
