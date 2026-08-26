import type { RemoteResult } from "@/lib/github/result";

export type DeveloperProfile = {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  website: string | null;
  publicRepositories: number;
  followers: number;
  following: number;
  createdAt: string;
};

export type Repository = {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isFork: boolean;
  isArchived: boolean;
  topics: string[];
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
};

export type ActivityItem = {
  id: string;
  type: string;
  description: string;
  repository: string;
  repositoryUrl: string;
  createdAt: string;
};

export type Organization = {
  id: number;
  login: string;
  avatarUrl: string;
  url: string;
  description: string | null;
};

export type ExternalContribution = {
  id: number;
  number: number;
  title: string;
  url: string;
  repository: string;
  state: "open" | "closed" | "merged";
  comments: number;
  createdAt: string;
  updatedAt: string;
};

export type RepositoryHealth = {
  score: number;
  hasReadme: boolean;
  hasLicense: boolean;
  hasContributingGuide: boolean;
  hasCodeOfConduct: boolean;
  hasIssueTemplate: boolean;
  hasPullRequestTemplate: boolean;
};

export type RepositoryRelease = {
  id: number;
  tagName: string;
  name: string | null;
  url: string;
  publishedAt: string | null;
  isPrerelease: boolean;
};

export type RepositoryInsight = {
  repositoryId: number;
  health: RemoteResult<RepositoryHealth | null>;
  latestRelease: RemoteResult<RepositoryRelease | null>;
};

export type DeveloperSummary = {
  analyzedAt: string;
  profile: DeveloperProfile;
  repositories: Repository[];
};

export type DeveloperData = DeveloperSummary & {
  activity: RemoteResult<ActivityItem[]>;
  organizations: RemoteResult<Organization[]>;
  recentStars: RemoteResult<Repository[]>;
  externalContributions: RemoteResult<{
    totalCount: number;
    items: ExternalContribution[];
  }>;
  repositoryInsights: RepositoryInsight[];
};
