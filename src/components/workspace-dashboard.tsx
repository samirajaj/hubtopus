import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CircleAlert,
  GitPullRequest,
  Inbox,
  ListChecks,
  LockKeyhole,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OptionalData } from "@/lib/github";
import type {
  WorkItem,
  WorkspaceData,
  WorkspaceNotification,
  WorkspaceRepository,
  WorkflowFailure,
} from "@/lib/github-workspace";

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
        <Fact
          label="Accessible repositories"
          value={data.repositories.length}
        />
        <Fact label="Private repositories" value={privateRepositories.length} />
        <Fact label="Open queue entries" value={activeWork} />
        <Fact label="Repos needing attention" value={maintenance.length} />
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

function Fact({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background min-w-0 px-4 py-5 sm:px-5">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function WorkSection({
  title,
  description,
  icon: Icon,
  value,
  referenceTime,
}: {
  title: string;
  description: string;
  icon: typeof GitPullRequest;
  value: OptionalData<{ totalCount: number; items: WorkItem[] }>;
  referenceTime: number;
}) {
  return (
    <section>
      <SectionHeading
        title={title}
        description={description}
        icon={<Icon className="size-4" aria-hidden="true" />}
        count={value.status === "ready" ? value.data.totalCount : undefined}
      />
      {value.status !== "ready" ? (
        <Unavailable status={value.status} />
      ) : value.data.items.length ? (
        <div className="divide-y border-y">
          {value.data.items.slice(0, 8).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 focus-visible:ring-ring group block px-1 py-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                <ArrowUpRight
                  className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {item.repository} #{item.number} - updated{" "}
                {formatRelativeDate(item.updatedAt, referenceTime)}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <Empty message="Nothing currently needs attention here." />
      )}
    </section>
  );
}

function NotificationSection({
  value,
  referenceTime,
}: {
  value: OptionalData<WorkspaceNotification[]>;
  referenceTime: number;
}) {
  return (
    <section>
      <SectionHeading
        title="Notifications"
        description="Unread GitHub notifications visible to this token."
        icon={<Bell className="size-4" aria-hidden="true" />}
        count={value.status === "ready" ? value.data.length : undefined}
      />
      {value.status !== "ready" ? (
        <Unavailable
          status={value.status}
          detail="This endpoint may require a compatible classic token."
        />
      ) : value.data.length ? (
        <div className="divide-y border-y">
          {value.data.slice(0, 8).map((notification) => (
            <a
              key={notification.id}
              href={notification.url}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 focus-visible:ring-ring block px-1 py-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 text-sm font-medium">
                  {notification.title}
                </p>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {formatReason(notification.reason)}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {notification.repository} -{" "}
                {formatRelativeDate(notification.updatedAt, referenceTime)}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <Empty message="No unread notifications." />
      )}
    </section>
  );
}

function MaintenanceSection({
  items,
}: {
  items: Array<{ repository: WorkspaceRepository; signals: string[] }>;
}) {
  return (
    <section>
      <SectionHeading
        title="Repository maintenance"
        description="Factual gaps found in repositories you can maintain."
        icon={<CircleAlert className="size-4" aria-hidden="true" />}
        count={items.length}
      />
      {items.length ? (
        <div className="divide-y border-y">
          {items.slice(0, 8).map(({ repository, signals }) => (
            <a
              key={repository.id}
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 focus-visible:ring-ring block px-1 py-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">
                  {repository.fullName}
                </p>
                {repository.isPrivate ? (
                  <LockKeyhole
                    className="text-muted-foreground size-3.5 shrink-0"
                    aria-label="Private repository"
                  />
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {signals.join(" - ")}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <Empty message="No maintenance gaps detected in the inspected repositories." />
      )}
    </section>
  );
}

function WorkflowSection({
  value,
}: {
  value: OptionalData<WorkflowFailure[]>;
}) {
  return (
    <section>
      <SectionHeading
        title="Latest workflow failures"
        description="Repositories whose most recent workflow run failed."
        icon={<Workflow className="size-4" aria-hidden="true" />}
        count={value.status === "ready" ? value.data.length : undefined}
      />
      {value.status !== "ready" ? (
        <Unavailable
          status={value.status}
          detail="Actions read permission is required for private repositories."
        />
      ) : value.data.length ? (
        <div className="divide-y border-y">
          {value.data.map((run) => (
            <a
              key={run.id}
              href={run.url}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 focus-visible:ring-ring block px-1 py-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              <p className="line-clamp-1 text-sm font-medium">{run.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {run.repository} - {run.name}
                {run.branch ? ` on ${run.branch}` : ""}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <Empty message="No latest-run failures found in the inspected repositories." />
      )}
    </section>
  );
}

function RepositoryInventory({
  repositories,
  truncated,
  referenceTime,
}: {
  repositories: WorkspaceRepository[];
  truncated: boolean;
  referenceTime: number;
}) {
  const sorted = [...repositories].sort(
    (left, right) =>
      Number(right.isPrivate) - Number(left.isPrivate) ||
      dateValue(right.updatedAt) - dateValue(left.updatedAt),
  );

  return (
    <section className="mt-14">
      <SectionHeading
        title="Accessible repositories"
        description="Recently updated repositories available to the connected token."
        icon={<LockKeyhole className="size-4" aria-hidden="true" />}
        count={repositories.length}
      />
      {sorted.length ? (
        <div className="divide-y border-y">
          {sorted.slice(0, 20).map((repository) => (
            <a
              key={repository.id}
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 focus-visible:ring-ring grid gap-2 px-1 py-4 focus-visible:ring-2 focus-visible:outline-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {repository.fullName}
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {repository.visibility}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {repository.description ?? "No repository description"}
                </p>
              </div>
              <p className="text-muted-foreground text-xs sm:text-right">
                {repository.language ?? "No language"} - pushed{" "}
                {formatRelativeDate(
                  repository.pushedAt ?? repository.updatedAt,
                  referenceTime,
                )}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <Empty message="This token cannot access any repositories." />
      )}
      {repositories.length > 20 || truncated ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Showing 20 of {repositories.length.toLocaleString()}
          {truncated ? "+" : ""} accessible repositories.
        </p>
      ) : null}
    </section>
  );
}

function SectionHeading({
  title,
  description,
  icon,
  count,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          {description}
        </p>
      </div>
      {count !== undefined ? (
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {count.toLocaleString()}
        </span>
      ) : null}
    </div>
  );
}

function Unavailable({
  status,
  detail,
}: {
  status: "rate-limit" | "unavailable";
  detail?: string;
}) {
  return (
    <div className="text-muted-foreground border-y py-6 text-sm">
      <p>
        {status === "rate-limit"
          ? "GitHub is temporarily rate limiting this section."
          : "The connected token cannot provide this section."}
      </p>
      {detail ? <p className="mt-1 text-xs">{detail}</p> : null}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground border-y py-6 text-sm">{message}</p>
  );
}

function buildMaintenanceItems(data: WorkspaceData) {
  const staleCutoff =
    new Date(data.analyzedAt).getTime() - 365 * 24 * 60 * 60 * 1000;

  return data.repositories
    .filter(
      (repository) =>
        repository.canAdminister &&
        !repository.isArchived &&
        !repository.isFork,
    )
    .map((repository) => {
      const signals: string[] = [];
      if (!repository.description) signals.push("missing description");
      if (!repository.license && !repository.isPrivate) {
        signals.push("missing license");
      }
      if (!repository.topics.length) signals.push("no topics");
      if (
        dateValue(repository.pushedAt ?? repository.updatedAt) < staleCutoff
      ) {
        signals.push("no push in 12 months");
      }
      return { repository, signals };
    })
    .filter((item) => item.signals.length)
    .sort(
      (left, right) =>
        right.signals.length - left.signals.length ||
        dateValue(right.repository.updatedAt) -
          dateValue(left.repository.updatedAt),
    );
}

function formatReason(value: string): string {
  return value.replaceAll("_", " ");
}

function formatRelativeDate(value: string, referenceTime: number): string {
  const days = Math.max(
    0,
    Math.floor((referenceTime - new Date(value).getTime()) / 86_400_000),
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function dateValue(value: string): number {
  return new Date(value).getTime();
}
