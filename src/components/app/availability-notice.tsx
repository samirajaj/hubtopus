import { CircleAlert } from "lucide-react";

import type { RemoteResultStatus } from "@/lib/github/result";
import { cn } from "@/lib/utils";

export function AvailabilityNotice({
  status,
  title,
  detail,
  className,
}: {
  status: Exclude<RemoteResultStatus, "ready">;
  title?: string;
  detail?: string;
  className?: string;
}) {
  const defaultTitle =
    status === "rate-limit"
      ? "GitHub is temporarily rate limiting this data"
      : "GitHub could not provide this data";

  return (
    <div
      className={cn(
        "flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm",
        className,
      )}
    >
      <CircleAlert
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium">{title ?? defaultTitle}</p>
        {detail ? (
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
