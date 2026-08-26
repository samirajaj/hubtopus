import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  OptionalNotice,
} from "@/features/developer/components/portfolio-states";
import type { DeveloperData } from "@/features/developer/types";

export function OpenSourceInterests({ data }: { data: DeveloperData }) {
  const section = data.recentStars;
  const repositories = section.status === "ready" ? section.data : [];
  const topicCounts = new Map<string, number>();
  const languageCounts = new Map<string, number>();

  repositories.forEach((repository) => {
    repository.topics.forEach((topic) =>
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1),
    );
    if (repository.language) {
      languageCounts.set(
        repository.language,
        (languageCounts.get(repository.language) ?? 0) + 1,
      );
    }
  });

  const interests = [...topicCounts.entries(), ...languageCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .filter(
      ([value], index, values) =>
        values.findIndex(
          ([candidate]) => candidate.toLowerCase() === value.toLowerCase(),
        ) === index,
    )
    .slice(0, 10)
    .map(([value]) => value);

  return (
    <section
      id="interests"
      className="scroll-mt-24"
      aria-labelledby="interests-heading"
    >
      <div className="mb-5">
        <h2 id="interests-heading" className="text-lg font-semibold">
          Open-source interests
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Signals from up to 100 recently starred public repositories
        </p>
      </div>
      {section.status !== "ready" ? (
        <OptionalNotice status={section.status} label="starred repositories" />
      ) : section.data.length ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <div>
            <h3 className="text-sm font-semibold">Recurring topics</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {interests.length ? (
                interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">
                  No language or topic signals detected.
                </span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Recently starred</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {section.data.slice(0, 6).map((repository) => (
                <li key={repository.id}>
                  <a
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:bg-muted focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Star
                      className="text-muted-foreground size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">
                      {repository.fullName}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <EmptyState text="This developer has no publicly visible starred repositories." />
      )}
    </section>
  );
}
