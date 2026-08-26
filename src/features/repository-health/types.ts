import type { WorkspaceRepository } from "@/features/workspace/types";

export type HealthSeverity = "high" | "medium" | "low";
export type HealthCategory =
  | "automation"
  | "activity"
  | "community"
  | "discoverability";

export type RepositoryFinding = {
  id: string;
  severity: HealthSeverity;
  category: HealthCategory;
  title: string;
  detail: string;
  action: string;
  url: string;
};

export type RepositoryHealthRecord = {
  repository: WorkspaceRepository;
  findings: RepositoryFinding[];
  status: "attention" | "healthy" | "archived";
};
