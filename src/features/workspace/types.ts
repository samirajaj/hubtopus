import type {
  GitHubNotification,
  GitHubRepository,
  GitHubUser,
  GitHubWorkflowFailure,
  GitHubWorkItem,
  PullRequestInsight,
} from "@/lib/github/models";
import type { RemoteResult } from "@/lib/github/result";

export type AuthenticatedUser = GitHubUser;
export type WorkspaceRepository = GitHubRepository;
export type WorkItem = GitHubWorkItem;
export type WorkspaceNotification = GitHubNotification;
export type WorkflowFailure = GitHubWorkflowFailure;

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
