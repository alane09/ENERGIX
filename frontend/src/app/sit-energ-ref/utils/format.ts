export function formatNumber(value: any, precision: number = 2): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "N/A";
  }
  const numValue = Number(value);
  return numValue.toFixed(precision);
}
