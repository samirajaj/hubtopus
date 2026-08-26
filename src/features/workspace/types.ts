import type { PullRequestInsight } from "@/features/operations/types";
import type { RemoteResult } from "@/lib/github/result";

export type AuthenticatedUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
};

export type WorkspaceRepository = {
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

export type WorkItem = {
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

export type WorkspaceNotification = {
  id: string;
  title: string;
  url: string;
  repository: string;
  reason: string;
  type: string;
  unread: boolean;
  updatedAt: string;
};

export type WorkflowFailure = {
  id: number;
  name: string;
  title: string;
  url: string;
  repository: string;
  branch: string | null;
  updatedAt: string;
};

export type WorkspaceData = {
  analyzedAt: string;
  connection: {
    method: "personal-token" | "github-app";
    expiresAt: string;
  };
  user: AuthenticatedUser;
  repositories: WorkspaceRepository[];
  repositoriesTruncated: boolean;
  assignedIssues: RemoteResult<{ totalCount: number; items: WorkItem[] }>;
  reviewRequests: RemoteResult<{ totalCount: number; items: WorkItem[] }>;
  authoredPullRequests: RemoteResult<{
    totalCount: number;
    items: WorkItem[];
  }>;
  notifications: RemoteResult<WorkspaceNotification[]>;
  workflowFailures: RemoteResult<WorkflowFailure[]>;
  workflowInspectionLimit: number;
  pullRequestInsights: RemoteResult<PullRequestInsight[]>;
  pullRequestInspectionLimit: number;
};

export type RepositoryHealthCenterData = {
  analyzedAt: string;
  user: AuthenticatedUser;
  repositories: WorkspaceRepository[];
  repositoriesTruncated: boolean;
  workflowFailures: RemoteResult<WorkflowFailure[]>;
  workflowInspectionLimit: number;
};
