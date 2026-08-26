import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ListChecks, LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WorkspaceData } from "@/features/workspace/types";

export function WorkspaceHeader({ data }: { data: WorkspaceData }) {
  return (
    <header className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <Image
          src={data.user.avatarUrl}
          alt={`${data.user.login}'s GitHub avatar`}
          width={72}
          height={72}
          priority
          className="size-16 rounded-md border sm:size-[72px]"
        />
        <div className="min-w-0">
          <p className="text-muted-foreground font-mono text-xs font-medium uppercase">
            Private workspace
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold">
            {data.user.name ?? data.user.login}
          </h1>
          <p className="text-muted-foreground truncate text-sm">
            @{data.user.login}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="lg" asChild>
          <Link href="/workspace/operations">
            <ListChecks aria-hidden="true" />
            Operations
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/workspace/health">
            <ShieldCheck aria-hidden="true" />
            Health center
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href={`/developers/${encodeURIComponent(data.user.login)}`}>
            Public brief
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
        <form action="/api/session" method="post">
          <input type="hidden" name="intent" value="disconnect" />
          <Button type="submit" variant="outline" size="lg">
            <LogOut aria-hidden="true" />
            Disconnect
          </Button>
        </form>
      </div>
    </header>
  );
}
