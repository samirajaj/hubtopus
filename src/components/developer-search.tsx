"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeGitHubUsername } from "@/lib/username";
import { cn } from "@/lib/utils";

type DeveloperSearchProps = {
  compact?: boolean;
  defaultValue?: string;
  className?: string;
};

export function DeveloperSearch({
  compact = false,
  defaultValue = "",
  className,
}: DeveloperSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = normalizeGitHubUsername(value);

    if (!username) {
      setError("Enter a valid GitHub username or profile URL.");
      return;
    }

    setError(null);
    router.push(`/developers/${encodeURIComponent(username)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("w-full", className)}
      aria-label="Search GitHub developers"
      noValidate
    >
      <div
        className={cn(
          "flex items-center gap-2",
          !compact && "bg-card rounded-lg border p-1.5 shadow-sm",
        )}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            placeholder={
              compact ? "Search username" : "GitHub username or profile URL"
            }
            aria-label="GitHub username or profile URL"
            aria-describedby={error ? "developer-search-error" : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "pl-9",
              compact
                ? "bg-background h-9"
                : "h-11 border-0 bg-transparent shadow-none focus-visible:ring-0",
            )}
          />
        </div>
        <Button
          type="submit"
          size={compact ? "lg" : "lg"}
          className={cn(!compact && "h-11 px-5")}
        >
          <span className={cn(compact && "hidden sm:inline")}>Search</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {error ? (
        <p
          id="developer-search-error"
          className="text-destructive mt-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
