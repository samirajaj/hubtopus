import { ComparisonForm } from "@/features/developer/components/comparison-form";
import { DeveloperIdentity } from "@/features/developer/components/developer-identity";
import { buildComparisonFacts } from "@/features/developer/domain/comparison-facts";
import type { DeveloperSummary } from "@/features/developer/types";
import { formatDate } from "@/lib/date";
import { formatNumber } from "@/lib/number";

export function DeveloperComparison({
  left,
  right,
}: {
  left: DeveloperSummary;
  right: DeveloperSummary;
}) {
  const leftFacts = buildComparisonFacts(left);
  const rightFacts = buildComparisonFacts(right);
  const rows: Array<{ label: string; left: string; right: string }> = [
    {
      label: "Public repos",
      left: formatNumber(left.profile.publicRepositories),
      right: formatNumber(right.profile.publicRepositories),
    },
    {
      label: "Source repos",
      left: formatNumber(leftFacts.sourceRepositories),
      right: formatNumber(rightFacts.sourceRepositories),
    },
    {
      label: "Active sources",
      left: formatNumber(leftFacts.activeSourceRepositories),
      right: formatNumber(rightFacts.activeSourceRepositories),
    },
    {
      label: "Stars received",
      left: formatNumber(leftFacts.totalStars),
      right: formatNumber(rightFacts.totalStars),
    },
    {
      label: "Forks received",
      left: formatNumber(leftFacts.totalForks),
      right: formatNumber(rightFacts.totalForks),
    },
    {
      label: "Followers",
      left: formatNumber(left.profile.followers),
      right: formatNumber(right.profile.followers),
    },
    {
      label: "Primary language",
      left: leftFacts.primaryLanguage ?? "Not detected",
      right: rightFacts.primaryLanguage ?? "Not detected",
    },
    {
      label: "Top repository",
      left: leftFacts.topRepository?.name ?? "None",
      right: rightFacts.topRepository?.name ?? "None",
    },
    {
      label: "Latest source push",
      left: leftFacts.latestPush
        ? formatDate(leftFacts.latestPush)
        : "No source activity",
      right: rightFacts.latestPush
        ? formatDate(rightFacts.latestPush)
        : "No source activity",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
          Factual comparison
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          Developer comparison
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Side-by-side public signals for context, not a ranking or assessment
          of developer quality.
        </p>
      </div>

      <ComparisonForm
        defaultLeft={left.profile.login}
        defaultRight={right.profile.login}
        compact
      />

      <section className="mt-10" aria-label="Compared developers">
        <div className="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-center gap-2 border-y py-6 sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)] sm:gap-4">
          <DeveloperIdentity summary={left} align="left" />
          <span className="text-muted-foreground text-center font-mono text-xs font-semibold">
            VS
          </span>
          <DeveloperIdentity summary={right} align="right" />
        </div>

        <dl className="divide-y border-b">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-center gap-2 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)] sm:gap-4"
            >
              <dd className="min-w-0 text-left font-semibold break-words">
                {row.left}
              </dd>
              <dt className="text-muted-foreground text-center text-xs font-medium">
                {row.label}
              </dt>
              <dd className="min-w-0 text-right font-semibold break-words">
                {row.right}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground mt-3 text-xs">
          Active sources means source repositories pushed to within the last 12
          months.
        </p>
      </section>
    </main>
  );
}
