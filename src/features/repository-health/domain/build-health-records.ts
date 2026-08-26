import type {
  RepositoryHealthCenterData,
  WorkspaceRepository,
  WorkflowFailure,
} from "@/features/workspace/types";
import type {
  HealthSeverity,
  RepositoryFinding,
  RepositoryHealthRecord,
} from "@/features/repository-health/types";
import { isAtLeastDaysOld } from "@/lib/date";
import { remoteDataOr } from "@/lib/github/result";

export function buildRepositoryHealthRecords(
  data: RepositoryHealthCenterData,
): RepositoryHealthRecord[] {
  const workflowFailures = new Map(
    remoteDataOr(data.workflowFailures, []).map((failure) => [
      failure.repository,
      failure,
    ]),
  );

  return data.repositories.map((repository) => {
    const findings = repository.isArchived
      ? []
      : buildFindings(
          repository,
          workflowFailures.get(repository.fullName),
          data.analyzedAt,
        );
    return {
      repository,
      findings,
      status: repository.isArchived
        ? "archived"
        : findings.length
          ? "attention"
          : "healthy",
    };
  });
}

function buildFindings(
  repository: WorkspaceRepository,
  workflowFailure: WorkflowFailure | undefined,
  analyzedAt: string,
): RepositoryFinding[] {
  const findings: RepositoryFinding[] = [];

  if (workflowFailure) {
    findings.push({
      id: "workflow-failure",
      severity: "high",
      category: "automation",
      title: "Latest workflow run failed",
      detail: `${workflowFailure.name} failed on ${workflowFailure.branch ?? "its configured branch"}.`,
      action: "Inspect failed run",
      url: workflowFailure.url,
    });
  }

  if (
    isAtLeastDaysOld(
      repository.pushedAt ?? repository.updatedAt,
      analyzedAt,
      365,
    )
  ) {
    findings.push({
      id: "stale-activity",
      severity: "medium",
      category: "activity",
      title: "No push in the last 12 months",
      detail:
        "The repository may need maintenance, archival, or an updated project status.",
      action: "Review commit history",
      url: `${repository.url}/commits/${encodeURIComponent(repository.defaultBranch)}`,
    });
  }

  if (!repository.isPrivate && !repository.isFork && !repository.license) {
    findings.push({
      id: "missing-license",
      severity: "medium",
      category: "community",
      title: "No license detected",
      detail:
        "Public source code without a license does not clearly grant reuse rights.",
      action: "Add a license",
      url: `${repository.url}/community/license/new?branch=${encodeURIComponent(repository.defaultBranch)}`,
    });
  }

  if (!repository.description) {
    findings.push({
      id: "missing-description",
      severity: "low",
      category: "discoverability",
      title: "Missing repository description",
      detail:
        "A short description makes the project easier to identify and search.",
      action: "Open repository settings",
      url: `${repository.url}/settings`,
    });
  }

  if (!repository.topics.length) {
    findings.push({
      id: "missing-topics",
      severity: "low",
      category: "discoverability",
      title: "No repository topics",
      detail: "Topics help people find the project by technology and purpose.",
      action: "Edit repository details",
      url: repository.url,
    });
  }

  return findings;
}

export function severityRank(severity: HealthSeverity): number {
  return { high: 3, medium: 2, low: 1 }[severity];
}
