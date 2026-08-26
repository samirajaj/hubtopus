import { Badge } from "@/components/ui/badge";
import type { WorkspaceData } from "@/features/workspace/types";
import { formatDateTime } from "@/lib/date";

export function ConnectionStatus({ data }: { data: WorkspaceData }) {
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
