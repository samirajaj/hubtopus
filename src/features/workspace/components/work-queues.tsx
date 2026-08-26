import { ArrowUpRight, Bell, GitPullRequest } from "lucide-react";

import {
  SectionHeading,
  Unavailable,
  Empty,
} from "@/features/workspace/components/section-state";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/date";
import type { RemoteResult } from "@/lib/github/result";
import type {
  WorkItem,
  WorkspaceNotification,
} from "@/features/workspace/types";

export function WorkSection({
  title,
  description,
  icon: Icon,
  value,
  referenceTime,
}: {
  title: string;
  description: string;
  icon: typeof GitPullRequest;
  value: RemoteResult<{ totalCount: number; items: WorkItem[] }>;
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

export function NotificationSection({
  value,
  referenceTime,
}: {
  value: RemoteResult<WorkspaceNotification[]>;
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
                  {notification.reason.replaceAll("_", " ")}
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
