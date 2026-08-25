"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export default function DeveloperError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next.js records the server-side exception; avoid exposing details in the UI.
    void error.digest;
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <span className="bg-muted flex size-12 items-center justify-center rounded-lg border">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Hubtopus could not finish loading this developer. Try the request
          again.
        </p>
        <Button onClick={reset} className="mt-6">
          <RotateCcw className="size-4" aria-hidden="true" /> Retry
        </Button>
      </main>
    </div>
  );
}
