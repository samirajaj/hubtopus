import { Code2 } from "lucide-react";

import type { Repository } from "@/features/developer/types";

const LANGUAGE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function LanguageBreakdown({
  repositories,
}: {
  repositories: Repository[];
}) {
  const counts = new Map<string, number>();
  repositories
    .filter((repository) => !repository.isFork && repository.language)
    .forEach((repository) => {
      const language = repository.language as string;
      counts.set(language, (counts.get(language) ?? 0) + 1);
    });

  const sortedLanguages = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const otherCount = sortedLanguages
    .slice(4)
    .reduce((sum, [, count]) => sum + count, 0);
  const visibleLanguages = [
    ...sortedLanguages.slice(0, 4),
    ...(otherCount ? [["Other", otherCount] as [string, number]] : []),
  ];
  const languages = visibleLanguages.map(([name, count], index) => ({
    name,
    count,
    color: LANGUAGE_COLORS[index],
  }));
  const total = languages.reduce((sum, language) => sum + language.count, 0);

  return (
    <section className="border-y py-7" aria-labelledby="languages-heading">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id="languages-heading" className="text-lg font-semibold">
            Primary languages
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Detected primary language across source repositories
          </p>
        </div>
        <Code2
          className="text-muted-foreground mt-1 size-5"
          aria-hidden="true"
        />
      </div>

      {languages.length ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:items-center">
          <div
            className="bg-muted flex h-3 w-full overflow-hidden rounded-sm"
            role="img"
            aria-label={languages
              .map(
                (language) =>
                  `${language.name}: ${language.count} repositories`,
              )
              .join(", ")}
          >
            {languages.map((language) => (
              <span
                key={language.name}
                style={{
                  width: `${(language.count / total) * 100}%`,
                  backgroundColor: language.color,
                }}
                title={`${language.name}: ${language.count}`}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-2">
            {languages.map((language) => (
              <li
                key={language.name}
                className="flex min-w-0 items-center gap-2"
              >
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: language.color }}
                  aria-hidden="true"
                />
                <span className="truncate font-medium">{language.name}</span>
                <span className="text-muted-foreground ml-auto">
                  {language.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
          No primary language data is available for this developer&apos;s source
          repositories.
        </p>
      )}
    </section>
  );
}
