import { AppHeader } from "@/components/app-header";
import { ComparisonForm } from "@/components/comparison-form";
import { DeveloperComparison } from "@/components/developer-comparison";
import { getDeveloperSummary } from "@/lib/github";
import { GitHubApiError } from "@/lib/github/errors";

export async function ComparisonPageContent({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  const [leftResult, rightResult] = await Promise.all([
    loadSummary(left),
    loadSummary(right),
  ]);

  if (leftResult.data && rightResult.data) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <DeveloperComparison left={leftResult.data} right={rightResult.data} />
      </div>
    );
  }

  const failedUsername = leftResult.error ? left : right;
  const error = leftResult.error ?? rightResult.error;
  const message =
    error instanceof GitHubApiError && error.kind === "not-found"
      ? `GitHub could not find @${failedUsername}.`
      : error instanceof GitHubApiError && error.kind === "rate-limit"
        ? "GitHub's rate limit currently prevents this comparison."
        : "GitHub could not provide the data needed for this comparison.";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
          Comparison unavailable
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          Choose another developer
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{message}</p>
        <div className="mt-6">
          <ComparisonForm defaultLeft={left} defaultRight={right} />
        </div>
      </main>
    </div>
  );
}

async function loadSummary(username: string) {
  return getDeveloperSummary(username).then(
    (data) => ({ data, error: null }),
    (error: unknown) => ({ data: null, error }),
  );
}
