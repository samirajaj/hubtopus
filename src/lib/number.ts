const numberFormatter = new Intl.NumberFormat("en");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
