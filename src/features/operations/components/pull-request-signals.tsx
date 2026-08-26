import type {
  PullRequestCheckSummary,
  PullRequestInsight,
  PullRequestReviewSummary,
} from "@/features/operations/types";

export function PullRequestSignals({
  insight,
}: {
  insight: PullRequestInsight;
}) {
  const review = insight.review.status === "ready" ? insight.review.data : null;
  const checks = insight.checks.status === "ready" ? insight.checks.data : null;
  const requestedReviewers = review?.requestedReviewers.join(", ") ?? "";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {insight.isDraft ? <SignalBadge label="Draft" tone="neutral" /> : null}
      <SignalBadge
        label={
          insight.mergeability === "conflicting"
            ? "Merge conflict"
            : insight.mergeability === "mergeable"
              ? "Mergeable"
              : "Mergeability pending"
        }
        tone={
          insight.mergeability === "conflicting"
            ? "danger"
            : insight.mergeability === "mergeable"
              ? "success"
              : "neutral"
        }
      />
      {review ? (
        <ReviewSignal review={review} />
      ) : (
        <SignalBadge
          label={
            insight.review.status === "rate-limit"
              ? "Reviews rate limited"
              : "Reviews unavailable"
          }
          tone="neutral"
        />
      )}
      {checks ? (
        <CheckSignals checks={checks} />
      ) : (
        <SignalBadge
          label={
            insight.checks.status === "rate-limit"
              ? "Checks rate limited"
              : "Checks unavailable"
          }
          tone="neutral"
        />
      )}
      {requestedReviewers ? (
        <span
          className="text-muted-foreground max-w-full truncate text-xs"
          title={requestedReviewers}
        >
          Requested: {requestedReviewers}
        </span>
      ) : null}
    </div>
  );
}

function ReviewSignal({ review }: { review: PullRequestReviewSummary }) {
  if (review.state === "draft") return null;
  if (review.state === "changes-requested") {
    return (
      <SignalBadge
        label={`${review.changesRequested} requested changes`}
        tone="danger"
      />
    );
  }
  if (review.state === "waiting-review") {
    return <SignalBadge label="Waiting for review" tone="warning" />;
  }
  if (review.state === "approved") {
    return (
      <SignalBadge
        label={`${review.approvals} approval recorded`}
        tone="success"
      />
    );
  }
  return <SignalBadge label="No approval recorded" tone="neutral" />;
}

function CheckSignals({ checks }: { checks: PullRequestCheckSummary }) {
  if (!checks.total) {
    return <SignalBadge label="No check runs" tone="neutral" />;
  }
  return (
    <>
      {checks.failed ? (
        <SignalBadge label={`${checks.failed} failed`} tone="danger" />
      ) : null}
      {checks.pending ? (
        <SignalBadge label={`${checks.pending} pending`} tone="warning" />
      ) : null}
      {checks.successful ? (
        <SignalBadge
          label={`${checks.successful} checks passed`}
          tone="success"
        />
      ) : null}
      {checks.other ? (
        <SignalBadge label={`${checks.other} other results`} tone="neutral" />
      ) : null}
    </>
  );
}

function SignalBadge({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "warning" | "success" | "neutral";
}) {
  const classes = {
    danger: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    warning:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    success:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    neutral: "text-muted-foreground bg-muted/50",
  }[tone];

  return (
    <span
      className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
