"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompareArrows } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeGitHubUsername } from "@/lib/username";

export function ComparisonForm({
  defaultLeft = "",
  defaultRight = "",
  compact = false,
}: {
  defaultLeft?: string;
  defaultRight?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [left, setLeft] = useState(defaultLeft);
  const [right, setRight] = useState(defaultRight);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const leftUsername = normalizeGitHubUsername(left);
    const rightUsername = normalizeGitHubUsername(right);

    if (!leftUsername || !rightUsername) {
      setError("Enter two valid GitHub usernames or profile URLs.");
      return;
    }

    if (leftUsername === rightUsername) {
      setError("Choose two different developers to compare.");
      return;
    }

    setError(null);
    router.push(
      `/compare/${encodeURIComponent(leftUsername)}/${encodeURIComponent(rightUsername)}`,
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full"
      aria-label="Compare GitHub developers"
      noValidate
    >
      <div
        className={`grid gap-2 ${compact ? "md:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto_1fr_auto]"}`}
      >
        <Input
          value={left}
          onChange={(event) => {
            setLeft(event.target.value);
            if (error) setError(null);
          }}
          placeholder="First username"
          aria-label="First GitHub username"
          aria-invalid={Boolean(error)}
          className="h-10"
          autoComplete="off"
          spellCheck={false}
        />
        {!compact ? (
          <span className="text-muted-foreground hidden self-center text-center text-xs font-medium sm:block">
            VS
          </span>
        ) : null}
        <Input
          value={right}
          onChange={(event) => {
            setRight(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Second username"
          aria-label="Second GitHub username"
          aria-invalid={Boolean(error)}
          className="h-10"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" size="lg" className="h-10">
          <GitCompareArrows aria-hidden="true" />
          Compare
        </Button>
      </div>
      {error ? (
        <p className="text-destructive mt-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
