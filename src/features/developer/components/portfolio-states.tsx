import { AvailabilityNotice } from "@/components/app/availability-notice";
import type { RemoteResultStatus } from "@/lib/github/result";

export function BriefFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b px-4 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

export function OptionalNotice({
  status,
  label,
  compact = false,
}: {
  status: Exclude<RemoteResultStatus, "ready">;
  label: string;
  compact?: boolean;
}) {
  return (
    <AvailabilityNotice
      status={status}
      title={
        status === "rate-limit"
          ? `GitHub's rate limit prevented loading ${label}.`
          : `GitHub could not provide ${label} right now.`
      }
      className={compact ? "mt-4 p-3" : "p-6"}
    />
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
      {text}
    </p>
  );
}

export function formatPortfolioDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
