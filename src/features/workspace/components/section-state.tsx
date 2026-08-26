import { formatNumber } from "@/lib/number";

export function SectionHeading({
  title,
  description,
  icon,
  count,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          {description}
        </p>
      </div>
      {count !== undefined ? (
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {formatNumber(count)}
        </span>
      ) : null}
    </div>
  );
}

export function Unavailable({
  status,
  detail,
}: {
  status: "rate-limit" | "unavailable";
  detail?: string;
}) {
  return (
    <AvailabilityNotice
      status={status}
      title={
        status === "rate-limit"
          ? "GitHub is temporarily rate limiting this section."
          : "The connected token cannot provide this section."
      }
      detail={detail}
      className="rounded-none border-x-0"
    />
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground border-y py-6 text-sm">{message}</p>
  );
}
import { AvailabilityNotice } from "@/components/app/availability-notice";
