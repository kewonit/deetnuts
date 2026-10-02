import {
  DEFAULT_YEAR,
  isRoundAvailableForYear,
  isSupportedYear,
} from "@/lib/mht-cet/state-cutoffs/config";

export function parseMhtCetDetailSelection(
  yearValue?: string | string[],
  roundValue?: string | string[],
): { year?: number; round?: number } | null {
  if (
    (yearValue !== undefined && typeof yearValue !== "string") ||
    (roundValue !== undefined && typeof roundValue !== "string")
  )
    return null;
  const year = parseAdmissionsInteger(yearValue);
  const round = parseAdmissionsInteger(roundValue);
  if (yearValue !== undefined && (year === undefined || !isSupportedYear(year)))
    return null;
  if (
    roundValue !== undefined &&
    (round === undefined ||
      !isRoundAvailableForYear(round, year ?? DEFAULT_YEAR))
  )
    return null;
  return { year, round };
}

export function parseAdmissionsInteger(value?: string): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export function withNeutralAdmissionsQuery(
  path: string,
  values: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}
