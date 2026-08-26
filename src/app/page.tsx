import { Code2, GitFork, Star } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { DeveloperSearch } from "@/components/developer-search";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto w-full max-w-3xl text-center">
            <p className="text-muted-foreground mb-4 font-mono text-xs font-medium tracking-normal uppercase">
              GitHub developer explorer
            </p>
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">
              Explore GitHub developers
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg">
              Search a GitHub username for a clear portfolio brief covering
              original work, project health, external contributions, and recent
              activity.
            </p>
            <DeveloperSearch className="mx-auto mt-8 max-w-2xl text-left" />
            <p className="text-muted-foreground mt-3 text-xs">
              Try a username or paste a github.com profile URL
            </p>
          </div>

          <div
            className="mx-auto mt-16 grid w-full max-w-3xl grid-cols-3 border-y"
            aria-hidden="true"
          >
            <LandingSignal icon={Code2} label="Languages" />
            <LandingSignal icon={Star} label="Stars" />
            <LandingSignal icon={GitFork} label="Repositories" />
          </div>
        </section>
      </main>
    </div>
  );
}

function LandingSignal({
  icon: Icon,
  label,
}: {
  icon: typeof Code2;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 border-r px-2 py-5 last:border-r-0 sm:flex-row sm:justify-center sm:px-5">
      <Icon className="text-muted-foreground size-4" />
      <span className="truncate text-xs font-medium sm:text-sm">{label}</span>
    </div>
  );
}
