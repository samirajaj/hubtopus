import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  GitPullRequest,
  Inbox,
  ListChecks,
  LogOut,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildMaintenanceItems,
  MaintenanceSection,
  WorkflowSection,
} from "@/components/workspace/maintenance-sections";
import { RepositoryInventory } from "@/components/workspace/repository-inventory";
import { SummaryFact } from "@/components/workspace/summary-fact";
import {
  NotificationSection,
  WorkSection,
} from "@/components/workspace/work-queues";
import { dateValue, formatDateTime } from "@/lib/date";
import type { WorkspaceData } from "@/lib/github-workspace";

export function WorkspaceDashboard({ data }: { data: WorkspaceData }) {
  const referenceTime = dateValue(data.analyzedAt);
  const privateRepositories = data.repositories.filter(
    (repository) => repository.isPrivate,
  );
  const maintenance = buildMaintenanceItems(data);
  const activeWork =
    data.assignedIssues.data.totalCount +
    data.reviewRequests.data.totalCount +
    data.authoredPullRequests.data.totalCount;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Image
            src={data.user.avatarUrl}
            alt={`${data.user.login}'s GitHub avatar`}
            width={72}
            height={72}
            priority
            className="size-16 rounded-md border sm:size-[72px]"
          />
          <div className="min-w-0">
            <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
              Private workspace
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold">
              {data.user.name ?? data.user.login}
            </h1>
            <p className="text-muted-foreground truncate text-sm">
              @{data.user.login}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="lg" asChild>
            <Link href="/workspace/operations">
              <ListChecks aria-hidden="true" />
              Operations
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/workspace/health">
              <ShieldCheck aria-hidden="true" />
              Health center
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href={`/developers/${encodeURIComponent(data.user.login)}`}>
              Public brief
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <form action="/api/session" method="post">
            <input type="hidden" name="intent" value="disconnect" />
            <Button type="submit" variant="outline" size="lg">
              <LogOut aria-hidden="true" />
              Disconnect
            </Button>
          </form>
        </div>
      </header>

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

function ConnectionStatus({ data }: { data: WorkspaceData }) {
  const workQueuesReady = [
    data.assignedIssues.status,
    data.reviewRequests.status,
    data.authoredPullRequests.status,
  ].every((status) => status === "ready");
  const statuses = [
    { label: "Repositories", ready: true },
    { label: "Work queues", ready: workQueuesReady },
    { label: "Notifications", ready: data.notifications.status === "ready" },
    { label: "Actions", ready: data.workflowFailures.status === "ready" },
  ];

  return (
    <section className="mt-8 border-y py-5" aria-labelledby="connection-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="connection-title" className="text-sm font-semibold">
              Connection access
            </h2>
            <Badge variant="outline">
              {data.connection.method === "github-app"
                ? "GitHub App"
                : "Personal token"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Session expires {formatDateTime(data.connection.expiresAt)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {statuses.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 text-xs"
            >
              <span
                className={`size-1.5 rounded-full ${
                  item.ready ? "bg-emerald-500" : "bg-amber-500"
                }`}
                aria-hidden="true"
              />
              {item.label}: {item.ready ? "ready" : "limited"}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
