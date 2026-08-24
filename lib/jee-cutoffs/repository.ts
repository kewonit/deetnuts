import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { readParquetRows } from "@ejam/data/college-predictor";
import { resolveDataRoot } from "@ejam/data/data-root";
import type {
  CounsellingBody,
  CutoffChartPoint,
  CutoffCollegeCatalogEntry,
  CutoffFilterOptions,
  CutoffHubModel,
  CutoffOffering,
  CutoffPageModel,
  CutoffSelection,
  CutoffServingRow,
  JeeCutoffCatalog,
  JeeExamId,
} from "./types";

const catalogPath = () =>
  path.join(resolveDataRoot(), "tools", "college-cutoffs", "catalog.json");

let catalogPromise: Promise<JeeCutoffCatalog> | null = null;
const collegeRows = new Map<string, Promise<CutoffServingRow[]>>();

function numberValue(value: unknown): number {
  return typeof value === "bigint" ? Number(value) : Number(value);
}

function normalizeRow(raw: Record<string, unknown>): CutoffServingRow {
  return {
    body: String(raw.body) as CounsellingBody,
    year: numberValue(raw.year),
    round: numberValue(raw.round),
    institute_id: String(raw.institute_id),
    source_program_id: String(raw.source_program_id),
    source_program_name: String(raw.source_program_name),
    canonical_program_id:
      raw.canonical_program_id === null || raw.canonical_program_id === undefined
        ? null
        : String(raw.canonical_program_id),
    offering_id: String(raw.offering_id),
    quota: String(raw.quota),
    seat_type: String(raw.seat_type),
    gender: String(raw.gender),
    opening_rank: numberValue(raw.opening_rank),
    closing_rank: numberValue(raw.closing_rank),
    exam_id: String(raw.exam_id) as JeeExamId,
    institute_type: String(raw.institute_type),
    degree: String(raw.degree),
    duration_years: numberValue(raw.duration_years),
    source: String(raw.source),
    source_id: String(raw.source_id),
    source_locator: String(raw.source_locator),
  };
}

export async function getJeeCutoffCatalog(): Promise<JeeCutoffCatalog> {
  catalogPromise ??= readFile(catalogPath(), "utf8").then(
    (value) => JSON.parse(value) as JeeCutoffCatalog,
  );
  return catalogPromise;
}

export async function getCutoffColleges(
  examId?: JeeExamId,
): Promise<CutoffCollegeCatalogEntry[]> {
  const catalog = await getJeeCutoffCatalog();
  return examId
    ? catalog.colleges.filter((college) => college.examId === examId)
    : catalog.colleges;
}

export async function getCutoffCollege(
  slug: string,
): Promise<CutoffCollegeCatalogEntry | null> {
  const catalog = await getJeeCutoffCatalog();
  return catalog.colleges.find((college) => college.id === slug) ?? null;
}

export async function getCutoffCollegeRows(
  college: CutoffCollegeCatalogEntry,
): Promise<CutoffServingRow[]> {
  const key = `${college.artifactSha256}|${college.id}`;
  let promise = collegeRows.get(key);
  if (!promise) {
    const artifactPath = path.join(resolveDataRoot(), college.artifactPath);
    promise = readParquetRows<Record<string, unknown>>(artifactPath).then((rows) =>
      rows.map(normalizeRow),
    );
    collegeRows.set(key, promise);
  }
  return promise;
}

export function examLabel(examId: JeeExamId): string {
  return examId === "jee-main" ? "JEE Main" : "JEE Advanced";
}

export function bodyLabel(body: CounsellingBody): string {
  return body === "josaa" ? "JoSAA" : "CSAB";
}

export function genderLabel(gender: string): string {
  if (gender === "NA") return "Not specified in source";
  return gender.replace("Female-only (including Supernumerary)", "Female-only");
}

export function offeringFromRow(row: CutoffServingRow): CutoffOffering {
  return {
    id: row.offering_id,
    sourceProgramId: row.source_program_id,
    canonicalProgramId: row.canonical_program_id,
    name: row.source_program_name,
    degree: row.degree,
    durationYears: row.duration_years,
    label: `${row.source_program_name} · ${row.degree} · ${row.duration_years} years`,
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function uniqueOfferings(rows: CutoffServingRow[]): CutoffOffering[] {
  const offerings = new Map<string, CutoffOffering>();
  for (const row of rows) offerings.set(row.offering_id, offeringFromRow(row));
  return [...offerings.values()].sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function preferred<T>(values: T[], preferences: T[]): T {
  for (const preference of preferences) {
    if (values.includes(preference)) return preference;
  }
  const value = values[0];
  if (value === undefined) throw new Error("Cannot choose from an empty cutoff axis");
  return value;
}

function chooseChartOffering(rows: CutoffServingRow[]): CutoffOffering {
  const offerings = uniqueOfferings(rows);
  const cse = offerings.find(
    (offering) =>
      offering.canonicalProgramId === "computer-science" &&
      /b\.?\s*tech/i.test(offering.degree) &&
      offering.durationYears === 4,
  );
  const offering = cse ?? offerings[0];
  if (!offering) throw new Error("Cannot choose a chart offering from empty rows");
  return offering;
}

function buildDefaultSelection(pageRows: CutoffServingRow[]): CutoffSelection {
  const bodies = [...new Set(pageRows.map((row) => row.body))];
  const body = preferred<CounsellingBody>(bodies, ["josaa", "csab"]);
  const bodyRows = pageRows.filter((row) => row.body === body);
  const round = Math.max(...bodyRows.map((row) => row.round));
  const roundRows = bodyRows.filter((row) => row.round === round);
  const seatType = preferred(uniqueStrings(roundRows.map((row) => row.seat_type)), [
    "OPEN",
    "OPEN(PwD)",
  ]);
  const seatRows = roundRows.filter((row) => row.seat_type === seatType);
  const gender = preferred(uniqueStrings(seatRows.map((row) => row.gender)), [
    "Gender-Neutral",
    "NA",
    "Female-only (including Supernumerary)",
  ]);
  const genderRows = seatRows.filter((row) => row.gender === gender);
  const quota = preferred(uniqueStrings(genderRows.map((row) => row.quota)), [
    "AI",
    "OS",
    "HS",
  ]);
  const profileRows = genderRows.filter((row) => row.quota === quota);
  const offering = chooseChartOffering(profileRows);
  return { body, round, quota, seatType, gender, offeringId: offering.id };
}

function tableSort(left: CutoffServingRow, right: CutoffServingRow): number {
  return (
    left.closing_rank - right.closing_rank ||
    left.opening_rank - right.opening_rank ||
    left.source_program_name.localeCompare(right.source_program_name) ||
    left.degree.localeCompare(right.degree) ||
    left.duration_years - right.duration_years
  );
}

function rowsForProfile(
  rows: CutoffServingRow[],
  selection: Omit<CutoffSelection, "offeringId">,
): CutoffServingRow[] {
  return rows.filter(
    (row) =>
      row.body === selection.body &&
      row.round === selection.round &&
      row.quota === selection.quota &&
      row.seat_type === selection.seatType &&
      row.gender === selection.gender,
  );
}

function chartForOffering(
  rows: CutoffServingRow[],
  selection: CutoffSelection,
): CutoffChartPoint[] {
  const matching = rows.filter(
      (row) =>
        row.body === selection.body &&
        row.quota === selection.quota &&
        row.seat_type === selection.seatType &&
        row.gender === selection.gender &&
        row.offering_id === selection.offeringId,
    );
  const maxRound = Math.max(
    ...rows.filter((row) => row.body === selection.body).map((row) => row.round),
  );
  return Array.from({ length: maxRound }, (_, index) => {
    const round = index + 1;
    const row = matching.find((candidate) => candidate.round === round);
    return {
      label: `R${round}`,
      round,
      openingRank: row?.opening_rank ?? null,
      closingRank: row?.closing_rank ?? null,
    };
  });
}

function filterOptionsForSelection(
  rows: CutoffServingRow[],
  selection: CutoffSelection,
): CutoffFilterOptions {
  const bodyRows = rows.filter((row) => row.body === selection.body);
  const roundRows = bodyRows.filter((row) => row.round === selection.round);
  const seatRows = roundRows.filter((row) => row.seat_type === selection.seatType);
  const genderRows = seatRows.filter((row) => row.gender === selection.gender);
  const profileRows = genderRows.filter((row) => row.quota === selection.quota);
  return {
    bodies: [...new Set(rows.map((row) => row.body))].sort(),
    rounds: [...new Set(bodyRows.map((row) => row.round))].sort((left, right) => left - right),
    quotas: uniqueStrings(genderRows.map((row) => row.quota)),
    seatTypes: uniqueStrings(roundRows.map((row) => row.seat_type)),
    genders: uniqueStrings(seatRows.map((row) => row.gender)),
    offerings: uniqueOfferings(profileRows),
  };
}

export async function getCutoffPageModel(
  examId: JeeExamId,
  slug: string,
  year: number,
): Promise<CutoffPageModel | null> {
  const catalog = await getJeeCutoffCatalog();
  const college = catalog.colleges.find((entry) => entry.id === slug);
  if (!college || college.examId !== examId) return null;
  const page = college.pages.find((entry) => entry.year === year);
  if (!page) return null;
  const rows = (await getCutoffCollegeRows(college)).filter(
    (row) => row.year === year,
  );
  const defaultSelection = buildDefaultSelection(rows);
  const tableRows = rowsForProfile(rows, defaultSelection).sort(tableSort);
  const chartOfferingRow = rows.find(
    (row) => row.offering_id === defaultSelection.offeringId,
  );
  if (!chartOfferingRow) throw new Error(`Missing chart offering for ${slug} ${year}`);
  const chartOffering = offeringFromRow(chartOfferingRow);
  const sources = [...new Map(
    rows.map((row) => [
      `${row.body}|${row.source_locator}`,
      {
        sourceId: row.source_id,
        body: row.body,
        label: `${bodyLabel(row.body)} published opening and closing ranks`,
        locator: row.source_locator,
      },
    ]),
  ).values()];
  return {
    catalog,
    college,
    page,
    defaultSelection,
    filterOptions: filterOptionsForSelection(rows, defaultSelection),
    tableRows: tableRows.slice(0, 100),
    tableTotal: tableRows.length,
    chartOffering,
    programs: uniqueOfferings(rows),
    chart: chartForOffering(rows, defaultSelection),
    sources,
  };
}

export async function getCutoffHubModel(
  examId: JeeExamId,
  slug: string,
): Promise<CutoffHubModel | null> {
  const catalog = await getJeeCutoffCatalog();
  const college = catalog.colleges.find((entry) => entry.id === slug);
  if (!college || college.examId !== examId) return null;
  const latestPage = college.pages[0];
  if (!latestPage) return null;
  const rows = await getCutoffCollegeRows(college);
  const latestRows = rows.filter((row) => row.year === latestPage.year);
  const selection = buildDefaultSelection(latestRows);
  const offeringRow = latestRows.find(
    (row) => row.offering_id === selection.offeringId,
  );
  if (!offeringRow) return null;
  const trend: CutoffChartPoint[] = [];
  const availableYears = college.pages.map((page) => page.year);
  const firstYear = Math.min(...availableYears);
  const lastYear = Math.max(...availableYears);
  for (let year = firstYear; year <= lastYear; year += 1) {
    const matching = rows.filter(
      (row) =>
        row.year === year &&
        row.body === selection.body &&
        row.quota === selection.quota &&
        row.seat_type === selection.seatType &&
        row.gender === selection.gender &&
        row.source_program_id === offeringRow.source_program_id &&
        row.degree === offeringRow.degree &&
        row.duration_years === offeringRow.duration_years,
    );
    if (matching.length === 0) {
      trend.push({
        label: String(year),
        year,
        openingRank: null,
        closingRank: null,
      });
      continue;
    }
    const latestRound = Math.max(...matching.map((row) => row.round));
    const point = matching.find((row) => row.round === latestRound);
    if (!point) continue;
    trend.push({
      label: String(year),
      year,
      openingRank: point.opening_rank,
      closingRank: point.closing_rank,
    });
  }
  return {
    catalog,
    college,
    latestPage,
    selection,
    offering: offeringFromRow(offeringRow),
    trend,
  };
}

export async function getCutoffStaticParams(
  examId: JeeExamId,
): Promise<Array<{ slug: string; year: string }>> {
  const colleges = await getCutoffColleges(examId);
  return colleges.flatMap((college) =>
    college.pages.map((page) => ({ slug: college.id, year: String(page.year) })),
  );
}

export async function getCutoffCollegeStaticParams(
  examId: JeeExamId,
): Promise<Array<{ slug: string }>> {
  return (await getCutoffColleges(examId)).map((college) => ({ slug: college.id }));
}
