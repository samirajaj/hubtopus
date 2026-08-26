import { severityRank } from "@/features/repository-health/domain/build-health-records";
import type { RepositoryHealthRecord } from "@/features/repository-health/types";

export function summarizeHealthRecords(records: RepositoryHealthRecord[]) {
  return {
    attention: records.filter((record) => record.status === "attention").length,
    healthy: records.filter((record) => record.status === "healthy").length,
    archived: records.filter((record) => record.status === "archived").length,
    high: records.filter((record) =>
      record.findings.some((finding) => finding.severity === "high"),
    ).length,
  };
}

export function compareHealthRecords(
  left: RepositoryHealthRecord,
  right: RepositoryHealthRecord,
) {
  const leftSeverity = Math.max(
    0,
    ...left.findings.map((finding) => severityRank(finding.severity)),
  );
  const rightSeverity = Math.max(
    0,
    ...right.findings.map((finding) => severityRank(finding.severity)),
  );
  return (
    rightSeverity - leftSeverity ||
    right.findings.length - left.findings.length ||
    left.repository.fullName.localeCompare(right.repository.fullName)
  );
}
