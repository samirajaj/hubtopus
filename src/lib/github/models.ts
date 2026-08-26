import type { RemoteResult } from "@/lib/github/result";

export type GitHubUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
};

export type GitHubRepository = {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  visibility: string;
  isFork: boolean;
  isArchived: boolean;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  hasIssuesEnabled: boolean;
  topics: string[];
  defaultBranch: string;
  license: string | null;
  pushedAt: string | null;
  updatedAt: string;
  owner: string;
  canAdminister: boolean;
};

export type GitHubWorkItem = {
  id: number;
  number: number;
  title: string;
  url: string;
  repository: string;
  kind: "issue" | "pull-request";
  comments: number;
  createdAt: string;
  updatedAt: string;
};

export type GitHubNotification = {
  id: string;
  title: string;
  url: string;
  repository: string;
  reason: string;
  type: string;
  unread: boolean;
  updatedAt: string;
};

export type GitHubWorkflowFailure = {
  id: number;
  name: string;
  title: string;
  url: string;
  repository: string;
  branch: string | null;
  updatedAt: string;
};

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
