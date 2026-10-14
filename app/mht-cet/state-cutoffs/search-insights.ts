export interface SearchInsight {
  totalMatchingRows: number;
  distinctCollegeCount: number;
  lowestMatchingCutoff: number | null;
  sampleCollegeNames: string[];
}

export interface SearchInsightSourceRow {
  college_name: string | null;
  cutoff_score: number | string | null;
}

function formatCutoff(value: number): string {
  return new Intl.NumberFormat("en", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 4,
  }).format(value);
}

function toNumericCutoff(value: number | string | null): number | null {
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function summarizeSearchInsightRows(
  rows: SearchInsightSourceRow[],
): SearchInsight | null {
  if (rows.length === 0) {
    return null;
  }

  const collegeNames = new Set<string>();
  let lowestMatchingCutoff: number | null = null;

  for (const row of rows) {
    if (row.college_name) {
      collegeNames.add(row.college_name);
    }

    const cutoff = toNumericCutoff(row.cutoff_score);
    if (cutoff !== null) {
      lowestMatchingCutoff =
        lowestMatchingCutoff === null
          ? cutoff
          : Math.min(lowestMatchingCutoff, cutoff);
    }
  }

  if (collegeNames.size === 0) {
    return null;
  }

  return {
    totalMatchingRows: rows.length,
    distinctCollegeCount: collegeNames.size,
    lowestMatchingCutoff,
    sampleCollegeNames: [...collegeNames].slice(0, 3),
  };
}

interface FormatSearchEmptyStateMessageOptions {
  hasFilters: boolean;
  percentileTarget: string;
  search: string;
  searchInsight: SearchInsight | null;
}

export function formatSearchEmptyStateMessage({
  hasFilters,
  percentileTarget,
  search,
  searchInsight,
}: FormatSearchEmptyStateMessageOptions): string {
  if (
    !search ||
    !percentileTarget ||
    !searchInsight ||
    searchInsight.totalMatchingRows === 0 ||
    searchInsight.lowestMatchingCutoff === null
  ) {
    return hasFilters
      ? "No cutoffs match. Remove a filter or change your score."
      : "Enter your rank or percentile.";
  }

  if (
    searchInsight.distinctCollegeCount === 1 &&
    searchInsight.sampleCollegeNames.length > 0
  ) {
    return `${searchInsight.sampleCollegeNames[0]}’s lowest matching cutoff is ${formatCutoff(searchInsight.lowestMatchingCutoff)}, above your ${percentileTarget}.`;
  }

  return `${searchInsight.totalMatchingRows} matching cutoffs at ${searchInsight.distinctCollegeCount} colleges; the lowest is ${formatCutoff(searchInsight.lowestMatchingCutoff)}, above your ${percentileTarget}.`;
}
