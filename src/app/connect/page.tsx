import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, LockKeyhole } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSessionConfigured, readGitHubSession } from "@/lib/github-session";

export const metadata: Metadata = {
  title: "Connect GitHub | Hubtopus",
  description: "Connect GitHub to open a private, read-only work dashboard.",
};

const errors: Record<string, string> = {
  invalid: "GitHub rejected that token. Check the value and its expiration.",
  config:
    "Token sessions are not configured on this server. Add HUBTOPUS_SESSION_SECRET first.",
};

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await readGitHubSession()) redirect("/workspace");

  const { error } = await searchParams;
  const configured = isSessionConfigured();
  const message = error ? errors[error] : null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-14 sm:px-6">
        <div className="mb-8">
          <div className="bg-muted mb-5 flex size-11 items-center justify-center rounded-md border">
            <KeyRound className="size-5" aria-hidden="true" />
          </div>
          <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
            Private workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Connect GitHub</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Use a read-only token to include work and repositories that are
            visible only to your account.
          </p>
        </div>

        <form
          action="/api/session"
          method="post"
          className="rounded-md border p-5 sm:p-6"
        >
          <label htmlFor="github-token" className="text-sm font-medium">
            Personal access token
          </label>
          <Input
            id="github-token"
            name="token"
            type="password"
            required
            minLength={20}
            maxLength={512}
            autoComplete="off"
            spellCheck={false}
            disabled={!configured}
            className="mt-2 h-10 font-mono"
            aria-describedby="token-security"
          />
          <p
            id="token-security"
            className="text-muted-foreground mt-2 text-xs leading-5"
          >
            The token is validated by GitHub, encrypted into an HttpOnly session
            cookie, and never exposed to client-side JavaScript.
          </p>

          {message ? (
            <p className="text-destructive mt-4 text-sm" role="alert">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full"
            disabled={!configured}
          >
            <LockKeyhole aria-hidden="true" />
            Connect securely
          </Button>
        </form>

        <p className="text-muted-foreground mt-5 text-xs leading-5">
          Prefer a fine-grained token restricted to the repositories you want
          Hubtopus to inspect. Notifications may require a compatible classic
          token. You can disconnect and remove the cookie at any time.{" "}
          <Link
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer"
            className="text-foreground rounded-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
          >
            Create a token on GitHub
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
