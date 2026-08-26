import {
  GitPullRequest,
  Inbox,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

import { SummaryFact } from "@/components/app/summary-fact";
import { ConnectionStatus } from "@/features/workspace/components/connection-status";
import {
  MaintenanceSection,
  WorkflowSection,
} from "@/features/workspace/components/maintenance-sections";
import { buildMaintenanceItems } from "@/features/workspace/domain/maintenance";
import { RepositoryInventory } from "@/features/workspace/components/repository-inventory";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";
import {
  NotificationSection,
  WorkSection,
} from "@/features/workspace/components/work-queues";
import type { WorkspaceData } from "@/features/workspace/types";
import { dateValue, formatDateTime } from "@/lib/date";
import { remoteDataOr } from "@/lib/github/result";

export function WorkspaceDashboard({ data }: { data: WorkspaceData }) {
  const referenceTime = dateValue(data.analyzedAt);
  const privateRepositories = data.repositories.filter(
    (repository) => repository.isPrivate,
  );
  const maintenance = buildMaintenanceItems(data);
  const emptyQueue = { totalCount: 0, items: [] };
  const activeWork =
    remoteDataOr(data.assignedIssues, emptyQueue).totalCount +
    remoteDataOr(data.reviewRequests, emptyQueue).totalCount +
    remoteDataOr(data.authoredPullRequests, emptyQueue).totalCount;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <WorkspaceHeader data={data} />

      <section
        className="bg-border mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border lg:grid-cols-4"
        aria-label="Workspace summary"
      >
        <SummaryFact
          label="Accessible repositories"
          value={data.repositories.length}
        />
        <SummaryFact
          label="Private repositories"
          value={privateRepositories.length}
        />
        <SummaryFact label="Open queue entries" value={activeWork} />
        <SummaryFact
          label="Repos needing attention"
          value={maintenance.length}
        />
      </section>

      <ConnectionStatus data={data} />

      <div className="mt-10 grid items-start gap-x-10 gap-y-12 lg:grid-cols-2">
        <WorkSection
          title="Review requests"
          description="Open pull requests currently requesting your review."
          icon={GitPullRequest}
          value={data.reviewRequests}
          referenceTime={referenceTime}
        />
        <WorkSection
          title="Assigned issues"
          description="Open issues currently assigned to your account."
          icon={Inbox}
          value={data.assignedIssues}
          referenceTime={referenceTime}
        />
        <WorkSection
          title="Authored pull requests"
          description="Your open pull requests, ordered by recent activity."
          icon={MessageSquare}
          value={data.authoredPullRequests}
          referenceTime={referenceTime}
        />
        <NotificationSection
          value={data.notifications}
          referenceTime={referenceTime}
        />
        <MaintenanceSection items={maintenance} />
        <WorkflowSection value={data.workflowFailures} />
      </div>

      <RepositoryInventory
        repositories={data.repositories}
        truncated={data.repositoriesTruncated}
        referenceTime={referenceTime}
      />

      <p className="text-muted-foreground mt-8 flex items-center gap-2 border-t pt-5 text-xs">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        Private data is fetched per request and is not placed in Hubtopus shared
        caches. Snapshot generated {formatDateTime(data.analyzedAt)}.
      </p>
    </main>
  );
}
