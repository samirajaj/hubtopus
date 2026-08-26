import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { ComparisonForm } from "@/features/developer/components/comparison-form";

export const metadata: Metadata = {
  title: "Compare GitHub Developers | Hubtopus",
  description:
    "Compare factual public GitHub signals for two developers side by side.",
};

export default function ComparePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
          Side-by-side context
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Compare GitHub developers
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-sm leading-6 sm:text-base">
          Compare public repositories, activity recency, languages, stars,
          forks, and followers without reducing developers to a score.
        </p>
        <div className="mt-8 text-left">
          <ComparisonForm />
        </div>
      </main>
    </div>
  );
}
