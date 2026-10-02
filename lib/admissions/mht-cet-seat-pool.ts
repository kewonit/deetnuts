import type { AdmissionsCutoffObservation } from "@/lib/admissions/types";

export type SeatPoolFacts = {
  categoryId: string | null;
  ladiesSeat: boolean;
  allocationScope: string;
  specialEligibility: string;
};

export type DescribedSeatPool = {
  label: string;
  scope: string | null;
  family: string;
  order: number;
  openGeneral: boolean;
};

export const MHT_CET_POOL_FAMILIES = [
  ["open", "Open"],
  ["sc", "SC"],
  ["st", "ST"],
  ["vj-dt", "VJ/DT"],
  ["nt-b", "NT-B"],
  ["nt-c", "NT-C"],
  ["nt-d", "NT-D"],
  ["obc", "OBC"],
  ["sebc", "SEBC"],
  ["ews", "EWS"],
  ["tfws", "TFWS"],
  ["defence", "Defence"],
  ["pwd", "PWD"],
  ["orphan", "Orphan"],
  ["minority", "Minority"],
] as const;

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  MHT_CET_POOL_FAMILIES.filter(([id]) =>
    ["open", "sc", "st", "vj-dt", "nt-b", "nt-c", "nt-d", "obc", "sebc"].includes(id),
  ),
);

const SPECIAL_LABELS: Record<string, string> = {
  ews: "EWS",
  tfws: "TFWS",
  defence: "Defence",
  pwd: "PWD",
  orphan: "Orphan",
  minority: "Minority",
};

const CODE_SCOPE_LABELS: Record<string, string> = {
  "home-university": "Home university",
  "other-university": "Other university",
  "state-level": "State level",
  "maharashtra-state": "Maharashtra state",
};

const SECTION_LABELS: Record<string, string> = {
  HOME_TO_HOME: "Home university",
  OTHER_TO_OTHER: "Other university",
  STATE_LEVEL: "State level",
  MAHARASHTRA_STATE: "Maharashtra state",
  HOME_TO_OTHER: "Home to other",
  OTHER_TO_HOME: "Other to home",
};

const SCOPE_RANK: Record<string, number> = {
  "home-university": 0,
  "other-university": 1,
  "state-level": 2,
  "maharashtra-state": 3,
};

const FAMILY_INDEX = new Map<string, number>(
  MHT_CET_POOL_FAMILIES.map(([id], index) => [id, index]),
);

export function allocationSectionLabel(section: string | null | undefined): string | null {
  if (!section) return null;
  return SECTION_LABELS[section] ?? section;
}

export function poolFamilyLabel(family: string): string {
  return MHT_CET_POOL_FAMILIES.find(([id]) => id === family)?.[1] ?? "Other";
}

export function seatPoolLine(described: DescribedSeatPool): string {
  return described.scope ? `${described.label}, ${described.scope}` : described.label;
}

function mergedScope(codeScope: string | null, sectionScope: string | null): string | null {
  if (!codeScope) return sectionScope;
  if (!sectionScope || codeScope === sectionScope) return codeScope;
  return `${codeScope}, ${sectionScope}`;
}

export function describeMhtCetSeatPool(input: {
  category: string;
  allocation?: string | null;
  entry: SeatPoolFacts | null;
}): DescribedSeatPool {
  const sectionScope = allocationSectionLabel(input.allocation);
  const entry = input.entry;
  if (!entry) {
    return {
      label: input.category,
      scope: sectionScope,
      family: "other",
      order: FAMILY_INDEX.size * 20 + 9,
      openGeneral: false,
    };
  }

  const codeScope = CODE_SCOPE_LABELS[entry.allocationScope] ?? null;
  const family =
    entry.specialEligibility !== "none"
      ? entry.specialEligibility
      : (entry.categoryId ?? "other");
  const categoryLabel = entry.categoryId ? (CATEGORY_LABELS[entry.categoryId] ?? null) : null;
  const specialLabel =
    entry.specialEligibility === "none" ? null : (SPECIAL_LABELS[entry.specialEligibility] ?? null);
  let label = input.category;
  let scope = mergedScope(codeScope, sectionScope);

  if (entry.specialEligibility === "ews") {
    label = "EWS";
    scope = codeScope && sectionScope && codeScope !== sectionScope ? `${codeScope}, ${sectionScope}` : null;
  } else if (entry.specialEligibility === "minority") {
    label = "Minority";
    scope = sectionScope;
  } else if (entry.specialEligibility === "tfws" || entry.specialEligibility === "orphan") {
    label = specialLabel ?? input.category;
  } else if (entry.specialEligibility === "defence" || entry.specialEligibility === "pwd") {
    label = [specialLabel, categoryLabel, entry.ladiesSeat ? "Ladies" : null].filter(Boolean).join(", ");
  } else {
    label = [categoryLabel, entry.ladiesSeat ? "Ladies" : "General"].filter(Boolean).join(", ");
  }

  const familyIndex = FAMILY_INDEX.get(family) ?? FAMILY_INDEX.size;
  return {
    label,
    scope,
    family,
    order: familyIndex * 20 + (entry.ladiesSeat ? 10 : 0) + (SCOPE_RANK[entry.allocationScope] ?? 9),
    openGeneral: entry.specialEligibility === "none" && entry.categoryId === "open" && !entry.ladiesSeat,
  };
}

export type MhtCetProgramRow = AdmissionsCutoffObservation & {
  showChoiceCode: boolean;
};

export function programHeadlineRows<T extends Pick<AdmissionsCutoffObservation, "poolFamily" | "poolLabel" | "openGeneral">>(
  rows: T[],
  family: string,
): T[] {
  if (family === "all" || family === "open") return rows.filter((row) => row.openGeneral);
  const inFamily = rows.filter((row) => row.poolFamily === family);
  const general = inFamily.filter((row) => !row.poolLabel.split(", ").includes("Ladies"));
  return general.length > 0 ? general : inFamily;
}

export type MhtCetProgramGroup = {
  id: string;
  name: string;
  anchor: string;
  codes: string[];
  openGeneral: MhtCetProgramRow[];
  rows: MhtCetProgramRow[];
};

function isTfwsChoiceCode(code: string): boolean {
  return /T$/i.test(code);
}

function programSlug(name: string): string {
  const slug = name
    .toLocaleLowerCase("en-IN")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "program";
}

function bestPercentile(rows: AdmissionsCutoffObservation[]): number | null {
  let best: number | null = null;
  for (const row of rows) {
    if (row.percentileValue != null && Number.isFinite(row.percentileValue) && (best == null || row.percentileValue > best)) {
      best = row.percentileValue;
    }
  }
  return best;
}

export function groupMhtCetPrograms(
  observations: AdmissionsCutoffObservation[],
): MhtCetProgramGroup[] {
  const byName = new Map<string, AdmissionsCutoffObservation[]>();
  for (const row of observations) {
    const list = byName.get(row.programName);
    if (list) list.push(row);
    else byName.set(row.programName, [row]);
  }

  const usedAnchors = new Map<string, number>();
  const groups: MhtCetProgramGroup[] = [];
  for (const [name, rows] of byName) {
    const codes = [...new Set(rows.map((row) => row.programCode))].sort((a, b) =>
      a.localeCompare(b, "en-IN"),
    );
    const hasMain = codes.some((code) => !isTfwsChoiceCode(code));
    const mainCodes = codes.filter((code) => !isTfwsChoiceCode(code) || !hasMain);
    const showEveryCode = mainCodes.length > 1;
    const sorted = [...rows].sort(
      (a, b) =>
        a.poolOrder - b.poolOrder ||
        a.category.localeCompare(b.category, "en-IN") ||
        a.programCode.localeCompare(b.programCode, "en-IN"),
    );
    const viewRows: MhtCetProgramRow[] = sorted.map((row) => ({
      ...row,
      showChoiceCode: showEveryCode || (hasMain && isTfwsChoiceCode(row.programCode)),
    }));
    const base = `program-${programSlug(name)}`;
    const seen = usedAnchors.get(base) ?? 0;
    usedAnchors.set(base, seen + 1);
    groups.push({
      id: mainCodes[0] || name,
      name,
      anchor: seen === 0 ? base : `${base}-${seen + 1}`,
      codes: mainCodes,
      openGeneral: viewRows
        .filter((row) => row.openGeneral)
        .sort((a, b) => (b.percentileValue ?? -1) - (a.percentileValue ?? -1)),
      rows: viewRows,
    });
  }

  groups.sort((a, b) => {
    const left = bestPercentile(a.openGeneral);
    const right = bestPercentile(b.openGeneral);
    if (left == null && right == null) return a.name.localeCompare(b.name, "en-IN");
    if (left == null) return 1;
    if (right == null) return -1;
    if (left !== right) return right - left;
    return a.name.localeCompare(b.name, "en-IN");
  });
  return groups;
}
