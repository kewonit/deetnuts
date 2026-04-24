export function formatPercentChange(value: number): string {
  const absoluteValue = Math.abs(value);

  const fractionDigits =
    absoluteValue === 0
      ? 2
      : absoluteValue < 0.01
        ? 4
        : absoluteValue < 1
          ? 3
          : 2;

  return new Intl.NumberFormat("en", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
