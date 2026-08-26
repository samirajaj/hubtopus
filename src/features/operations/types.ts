import type { RemoteResult, RemoteResultStatus } from "@/lib/github/result";

export type PullRequestReviewState =
  | "draft"
  | "changes-requested"
  | "waiting-review"
  | "approved"
  | "none";

export type PullRequestReviewSummary = {
  state: PullRequestReviewState;
  approvals: number;
  changesRequested: number;
  requestedReviewers: string[];
};

export type PullRequestCheckSummary = {
  total: number;
  failed: number;
  pending: number;
  successful: number;
  other: number;
  firstFailureUrl: string | null;
};

export type PullRequestInsight = {
  repository: string;
  number: number;
  isDraft: boolean;
  mergeability: "mergeable" | "conflicting" | "unknown";
  review: RemoteResult<PullRequestReviewSummary>;
  checks: RemoteResult<PullRequestCheckSummary>;
};

export type PullRequestTarget = {
  repository: string;
  number: number;
};

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
