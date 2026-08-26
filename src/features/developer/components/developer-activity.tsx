import { EmptyState } from "@/features/developer/components/portfolio-states";
import type { DeveloperData } from "@/features/developer/types";

export function DeveloperActivity({ data }: { data: DeveloperData }) {
  return (
    <section
      id="activity"
      className="scroll-mt-24 pt-10"
      aria-labelledby="activity-heading"
    >
      <div className="mb-5">
        <h2 id="activity-heading" className="text-lg font-semibold">
          Recent public activity
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          A limited view of recent public events made available by GitHub
        </p>
      </div>
      {data.activity.status === "ready" && data.activity.data.length ? (
        <ol className="divide-y border-y">
          {data.activity.data.slice(0, 12).map((item) => (
            <li
              key={item.id}
              className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"
            >
              <p className="min-w-0 text-sm">
                <span className="font-medium">{item.description}</span>{" "}
                <a
                  href={item.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {item.repository}
                </a>
              </p>
              <time
                dateTime={item.createdAt}
                className="text-muted-foreground text-xs sm:text-right"
              >
                {formatActivityDate(item.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      ) : data.activity.status === "ready" ? (
        <EmptyState text="GitHub did not return any recent supported public activity for this developer." />
      ) : (
        <EmptyState
          text={
            data.activity.status === "rate-limit"
              ? "GitHub's rate limit prevented loading recent activity."
              : "GitHub could not provide recent activity right now."
          }
        />
      )}
    </section>
  );
}

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
