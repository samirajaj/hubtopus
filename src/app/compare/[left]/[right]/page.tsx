import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { ComparisonForm } from "@/features/developer/components/comparison-form";
import { ComparisonPageContent } from "@/features/developer/components/comparison-page-content";
import { normalizeGitHubUsername } from "@/lib/username";

type PageProps = { params: Promise<{ left: string; right: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { left, right } = await params;
  return {
    title: `@${left} vs @${right} | Hubtopus`,
    description: `Compare public GitHub signals for @${left} and @${right}.`,
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  const values = await params;
  const left = normalizeGitHubUsername(values.left);
  const right = normalizeGitHubUsername(values.right);

  if (!left || !right || left === right) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
          <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
            Invalid comparison
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Choose two different developers
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Enter two valid GitHub usernames or profile URLs.
          </p>
          <div className="mt-6">
            <ComparisonForm
              defaultLeft={left ?? ""}
              defaultRight={right ?? ""}
            />
          </div>
        </main>
      </div>
    );
  }

  return <ComparisonPageContent left={left} right={right} />;
}
