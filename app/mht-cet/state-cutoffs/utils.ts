// Helper function to calculate distance from target percentile
export const calculatePercentileDistance = (
  currentPercentile: number,
  targetPercentile: number,
): number => {
  return (
    Math.round((targetPercentile - currentPercentile) * 10000000000) /
    10000000000
  );
};

export const formatPercentileDistance = (distance: number): string => {
  const absoluteDistance = Math.abs(distance);
  const fractionDigits =
    absoluteDistance === 0
      ? 2
      : absoluteDistance < 0.01
        ? 4
        : absoluteDistance < 1
          ? 3
          : 2;

  return new Intl.NumberFormat("en", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(absoluteDistance);
};
