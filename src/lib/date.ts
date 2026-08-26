export const DAY_IN_MILLISECONDS = 86_400_000;

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});
const monthYearFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});
const timeWithZoneFormatter = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

export function dateValue(value: string): number {
  return new Date(value).getTime();
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatMonthYear(value: string): string {
  return monthYearFormatter.format(new Date(value));
}

export function formatTimeWithZone(value: string | Date): string {
  return timeWithZoneFormatter.format(
    value instanceof Date ? value : new Date(value),
  );
}

export function ageInDays(
  value: string,
  referenceTime: string | number,
): number {
  const reference =
    typeof referenceTime === "number"
      ? referenceTime
      : dateValue(referenceTime);
  return Math.max(
    0,
    Math.floor((reference - dateValue(value)) / DAY_IN_MILLISECONDS),
  );
}

export function isWithinDays(
  value: string,
  referenceTime: string | number,
  days: number,
): boolean {
  return ageInDays(value, referenceTime) < days;
}

export function isAtLeastDaysOld(
  value: string,
  referenceTime: string | number,
  days: number,
): boolean {
  return ageInDays(value, referenceTime) >= days;
}

export function compareDatesDescending(left: string, right: string): number {
  return dateValue(right) - dateValue(left);
}

export function formatRelativeDate(
  value: string,
  referenceTime: string | number,
): string {
  const days = ageInDays(value, referenceTime);

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
