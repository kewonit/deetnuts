import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { MhtCetCutoffRow } from "@/lib/admissions/data";

const LOCAL_ARCHIVES: Record<number, Record<number, string>> = {
  2026: {
    1: "data/output/mahacet_2026_cap_round_1/database/normalized_cutoffs.json",
  },
};

const indexes = new Map<string, Map<string, MhtCetCutoffRow[]>>();

export function collegeCodeKey(code: string): string {
  const numeric = Number(code);
  return Number.isFinite(numeric) ? String(numeric) : code.trim();
}

export function indexCutoffRecords(
  records: MhtCetCutoffRow[],
): Map<string, MhtCetCutoffRow[]> {
  const index = new Map<string, MhtCetCutoffRow[]>();
  for (const record of records) {
    if (!record?.college_code || !record.course_name) continue;
    const key = collegeCodeKey(record.college_code);
    const rows = index.get(key);
    if (rows) rows.push(record);
    else index.set(key, [record]);
  }
  for (const rows of index.values()) {
    rows.sort(
      (a, b) =>
        a.course_name.localeCompare(b.course_name, "en-IN") ||
        a.category.localeCompare(b.category, "en-IN"),
    );
  }
  return index;
}

function loadIndex(
  absolutePath: string,
): Map<string, MhtCetCutoffRow[]> | null {
  const cached = indexes.get(absolutePath);
  if (cached) return cached;
  if (!existsSync(absolutePath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(absolutePath, "utf8")) as {
      records?: MhtCetCutoffRow[];
    };
    if (!parsed || !Array.isArray(parsed.records)) return null;
    const index = indexCutoffRecords(parsed.records);
    indexes.set(absolutePath, index);
    return index;
  } catch {
    return null;
  }
}

export function readLocalMhtCetCollegeCutoffs(
  collegeId: string,
  year: number,
  round: number,
  archiveRoot: string = process.cwd(),
): MhtCetCutoffRow[] | null {
  const relativePath = LOCAL_ARCHIVES[year]?.[round];
  if (!relativePath) return null;
  const index = loadIndex(resolve(archiveRoot, relativePath));
  if (!index) return null;
  // This archive is partial; a missing college is not evidence that it does not exist.
  return index.get(collegeCodeKey(collegeId)) ?? null;
}
