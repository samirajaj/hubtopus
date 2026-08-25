import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { ComparisonForm } from "@/components/comparison-form";
import { normalizeGitHubUsername } from "@/lib/username";

export const metadata: Metadata = {
  title: "Choose a Developer to Compare | Hubtopus",
};

export default async function ChooseComparisonPage({
  params,
}: {
  params: Promise<{ left: string }>;
}) {
  const { left } = await params;
  const username = normalizeGitHubUsername(left) ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
          Add a comparison
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Who should we compare?</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Keep @{username || left} and choose a second GitHub developer.
        </p>
        <div className="mt-8 text-left">
          <ComparisonForm defaultLeft={username} />
        </div>
      </main>
    </div>
  );
}
