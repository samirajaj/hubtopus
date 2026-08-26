const DAY_IN_MILLISECONDS = 86_400_000;

export function dateValue(value: string): number {
  return new Date(value).getTime();
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeDate(
  value: string,
  referenceTime: string | number,
): string {
  const reference =
    typeof referenceTime === "number"
      ? referenceTime
      : new Date(referenceTime).getTime();
  const days = Math.max(
    0,
    Math.floor((reference - new Date(value).getTime()) / DAY_IN_MILLISECONDS),
  );

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
