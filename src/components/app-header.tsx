import { Brand } from "@/components/brand";
import { DeveloperSearch } from "@/components/developer-search";
import { ModeToggle } from "@/components/mode-toggle";

export function AppHeader({ username }: { username?: string }) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Brand className="shrink-0 [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        {username ? (
          <DeveloperSearch
            compact
            defaultValue={username}
            className="mx-auto max-w-xl"
          />
        ) : (
          <div className="flex-1" />
        )}
        <ModeToggle />
      </div>
    </header>
  );
}
