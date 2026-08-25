import Link from "next/link";
import { Network } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-visible:ring-ring inline-flex items-center gap-2 rounded-md text-base font-semibold focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <span className="bg-foreground text-background flex size-8 items-center justify-center rounded-md">
        <Network className="size-4" aria-hidden="true" />
      </span>
      <span>Hubtopus</span>
    </Link>
  );
}
