import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { readParquetRows } from "@ejam/data/college-predictor";
import { resolveDataRoot } from "@ejam/data";
import {
  bodyLabel,
  genderLabel,
  getCutoffCollege,
  getCutoffCollegeRows,
  getJeeCutoffCatalog,
  offeringFromRow,
} from "./repository";
import type {
  CounsellingBody,
  CutoffChartPoint,
  CutoffOffering,
  CutoffServingRow,
  CutoffSourceRegistryEntry,
  JeeExamId,
  JeeSeoRoute,
  SeoRouteType,
} from "./types";

type RawSeoRoute = {
  route_type: SeoRouteType;
  path: string;
  exam_id: JeeExamId | null;
  college_id: string | null;
  year: number | bigint | null;
  program_slug: string | null;
  offering_id: string | null;
  body: CounsellingBody | null;
  quota: string | null;
  seat_type: string | null;
  gender: string | null;
  rounds_json: string;
  row_count: number | bigint;
  round_count: number | bigint;
  indexable: boolean;
  index_reason: string;
  content_sha256: string;
  last_changed_at: string | Date;
  source_ids_json: string;
  rights_status: "unconfirmed";
};

type SourceRegistry = {
  sources: CutoffSourceRegistryEntry[];
};

export type ProgramProfileSummary = {
  route: JeeSeoRoute;
  latestRound: number;
  openingRank: number;
  closingRank: number;
};

export type ProgramPageModel = {
  route: JeeSeoRoute;
  college: NonNullable<Awaited<ReturnType<typeof getCutoffCollege>>>;
  offering: CutoffOffering;
  profiles: ProgramProfileSummary[];
  defaultProfile: ProgramProfileSummary;
  chart: CutoffChartPoint[];
  adjacentYears: JeeSeoRoute[];
  sources: CutoffSourceRegistryEntry[];
  release: string;
};

export type ProfilePageModel = {
  route: JeeSeoRoute;
  college: NonNullable<Awaited<ReturnType<typeof getCutoffCollege>>>;
  offering: CutoffOffering;
  rows: CutoffServingRow[];
  chart: CutoffChartPoint[];
  siblingProfiles: JeeSeoRoute[];
  programPath: string;
  sources: CutoffSourceRegistryEntry[];
  release: string;
};

let routesPromise: Promise<JeeSeoRoute[]> | null = null;
let sourcePromise: Promise<CutoffSourceRegistryEntry[]> | null = null;

function normalizeRoute(raw: RawSeoRoute): JeeSeoRoute {
  return {
    routeType: raw.route_type,
    path: raw.path,
    examId: raw.exam_id,
    collegeId: raw.college_id,
    year: raw.year === null ? null : Number(raw.year),
    programSlug: raw.program_slug,
    offeringId: raw.offering_id,
    body: raw.body,
    quota: raw.quota,
    seatType: raw.seat_type,
    gender: raw.gender,
    rounds: JSON.parse(raw.rounds_json) as number[],
    rowCount: Number(raw.row_count),
    roundCount: Number(raw.round_count),
    indexable: raw.indexable,
    indexReason: raw.index_reason,
    contentSha256: raw.content_sha256,
    lastChangedAt:
      raw.last_changed_at instanceof Date
        ? raw.last_changed_at.toISOString()
        : String(raw.last_changed_at),
    sourceIds: JSON.parse(raw.source_ids_json) as string[],
    rightsStatus: raw.rights_status,
  };
}

export async function getJeeSeoRoutes(): Promise<JeeSeoRoute[]> {
  if (!routesPromise) {
    routesPromise = getJeeCutoffCatalog().then(async (catalog) => {
      const rows = await readParquetRows<RawSeoRoute>(
        path.join(resolveDataRoot(), catalog.seoRoutesArtifactPath),
      );
      return rows.map(normalizeRoute);
    });
  }
  return routesPromise;
}

export async function getJeeSeoRoute(routePath: string): Promise<JeeSeoRoute | null> {
  return (await getJeeSeoRoutes()).find((route) => route.path === routePath) ?? null;
}

export async function getCutoffSources(): Promise<CutoffSourceRegistryEntry[]> {
  if (!sourcePromise) {
    sourcePromise = getJeeCutoffCatalog().then(async (catalog) => {
      const registry = JSON.parse(
        await readFile(path.join(resolveDataRoot(), catalog.sourceRegistryPath), "utf8"),
      ) as SourceRegistry;
      return registry.sources;
    });
  }
  return sourcePromise;
}

async function sourcesFor(route: JeeSeoRoute): Promise<CutoffSourceRegistryEntry[]> {
  const wanted = new Set(route.sourceIds);
  return (await getCutoffSources()).filter((source) => wanted.has(source.sourceId));
}

function profilePreference(route: JeeSeoRoute): number {
  return (
    (route.body === "josaa" ? 0 : 100) +
    (route.seatType === "OPEN" ? 0 : 20) +
    (route.gender === "Gender-Neutral" ? 0 : 10) +
    ({ AI: 0, OS: 1, HS: 2 }[route.quota ?? ""] ?? 5) +
    (route.indexable ? 0 : 50)
  );
}

function rowsForRoute(rows: CutoffServingRow[], route: JeeSeoRoute): CutoffServingRow[] {
  return rows.filter(
    (row) =>
      row.year === route.year &&
      row.offering_id === route.offeringId &&
      (route.body === null || row.body === route.body) &&
      (route.quota === null || row.quota === route.quota) &&
      (route.seatType === null || row.seat_type === route.seatType) &&
      (route.gender === null || row.gender === route.gender),
  );
}

function chartFromRows(rows: CutoffServingRow[], maximumRound?: number): CutoffChartPoint[] {
  const maxRound = maximumRound ?? Math.max(...rows.map((row) => row.round));
  return Array.from({ length: maxRound }, (_, index) => {
    const round = index + 1;
    const row = rows.find((candidate) => candidate.round === round);
    return {
      label: `R${round}`,
      round,
      openingRank: row?.opening_rank ?? null,
      closingRank: row?.closing_rank ?? null,
    };
  });
}

export async function getProgramRoutesForYear(
  exam: JeeExamId,
  college: string,
  year: number,
): Promise<JeeSeoRoute[]> {
  return (await getJeeSeoRoutes()).filter(
    (route) =>
      route.routeType === "program" &&
      route.examId === exam &&
      route.collegeId === college &&
      route.year === year,
  );
}

export async function getProgramPageModel(
  exam: JeeExamId,
  collegeId: string,
  year: number,
  programSlug: string,
): Promise<ProgramPageModel | null> {
  const programPath = `/${exam}/colleges/${collegeId}/cutoffs/${year}/programs/${programSlug}`;
  const [route, college, allRoutes, catalog] = await Promise.all([
    getJeeSeoRoute(programPath),
    getCutoffCollege(collegeId),
    getJeeSeoRoutes(),
    getJeeCutoffCatalog(),
  ]);
  if (!route || route.routeType !== "program" || !college || college.examId !== exam) return null;
  const collegeRows = await getCutoffCollegeRows(college);
  const offeringRows = rowsForRoute(collegeRows, route);
  const first = offeringRows[0];
  if (!first) return null;
  const profileRoutes = allRoutes
    .filter((candidate) => candidate.routeType === "profile" && candidate.path.startsWith(`${programPath}/`))
    .sort((left, right) => profilePreference(left) - profilePreference(right) || left.path.localeCompare(right.path));
  const profiles = profileRoutes.map((profileRoute) => {
    const rows = rowsForRoute(collegeRows, profileRoute).sort((left, right) => left.round - right.round);
    const latest = rows.at(-1);
    if (!latest) throw new Error(`Empty profile route ${profileRoute.path}`);
    return {
      route: profileRoute,
      latestRound: latest.round,
      openingRank: latest.opening_rank,
      closingRank: latest.closing_rank,
    };
  });
  const defaultProfile = profiles[0];
  if (!defaultProfile) return null;
  const defaultRows = rowsForRoute(collegeRows, defaultProfile.route);
  const bodyRows = collegeRows.filter(
    (row) => row.year === year && row.body === defaultProfile.route.body,
  );
  const maxBodyRound = Math.max(...bodyRows.map((row) => row.round));
  const adjacentYears = allRoutes
    .filter(
      (candidate) =>
        candidate.routeType === "program" &&
        candidate.examId === exam &&
        candidate.collegeId === collegeId &&
        candidate.offeringId === route.offeringId &&
        candidate.path !== route.path,
    )
    .sort((left, right) => (right.year ?? 0) - (left.year ?? 0));
  return {
    route,
    college,
    offering: offeringFromRow(first),
    profiles,
    defaultProfile,
    chart: chartFromRows(defaultRows, maxBodyRound),
    adjacentYears,
    sources: await sourcesFor(route),
    release: catalog.releaseVersion,
  };
}

export async function getProfilePageModel(routePath: string): Promise<ProfilePageModel | null> {
  const [route, catalog, allRoutes] = await Promise.all([
    getJeeSeoRoute(routePath),
    getJeeCutoffCatalog(),
    getJeeSeoRoutes(),
  ]);
  if (
    !route ||
    route.routeType !== "profile" ||
    !route.examId ||
    !route.collegeId ||
    route.year === null ||
    !route.programSlug
  ) return null;
  const college = await getCutoffCollege(route.collegeId);
  if (!college || college.examId !== route.examId) return null;
  const collegeRows = await getCutoffCollegeRows(college);
  const rows = rowsForRoute(collegeRows, route).sort((left, right) => left.round - right.round);
  const first = rows[0];
  if (!first) return null;
  const programPath = `/${route.examId}/colleges/${route.collegeId}/cutoffs/${route.year}/programs/${route.programSlug}`;
  return {
    route,
    college,
    offering: offeringFromRow(first),
    rows,
    chart: chartFromRows(rows, Math.max(...route.rounds)),
    siblingProfiles: allRoutes
      .filter((candidate) => candidate.routeType === "profile" && candidate.path.startsWith(`${programPath}/`) && candidate.path !== route.path)
      .sort((left, right) => profilePreference(left) - profilePreference(right) || left.path.localeCompare(right.path)),
    programPath,
    sources: await sourcesFor(route),
    release: catalog.releaseVersion,
  };
}

export function profileLabel(route: JeeSeoRoute): string {
  if (!route.body || !route.quota || !route.seatType || !route.gender) return "Cutoff profile";
  return `${bodyLabel(route.body)} · ${route.quota} quota · ${route.seatType} · ${genderLabel(route.gender)}`;
}
