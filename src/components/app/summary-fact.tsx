export function SummaryFact({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-background min-w-0 px-4 py-5 sm:px-5">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}
