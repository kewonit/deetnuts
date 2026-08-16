export type JeeExamId = "jee-main" | "jee-advanced";
export type CounsellingBody = "josaa" | "csab";

export type CutoffPageCatalogEntry = {
  year: number;
  bodies: CounsellingBody[];
  roundsByBody: Partial<Record<CounsellingBody, number[]>>;
  rowCount: number;
  contentSha256: string;
  lastChangedAt: string;
};

export type CutoffCollegeCatalogEntry = {
  id: string;
  name: string;
  seoName: string;
  aliases: string[];
  type: string;
  state: string;
  city: string;
  established: number;
  examId: JeeExamId;
  artifactPath: string;
  artifactSha256: string;
  rowCount: number;
  pages: CutoffPageCatalogEntry[];
};

export type JeeCutoffCatalog = {
  schemaVersion: 2;
  releaseVersion: string;
  sourceManifestVersion: string;
  generatedAt: string;
  seoRoutesArtifactPath: string;
  seoRoutesArtifactSha256: string;
  sourceRegistryPath: string;
  sourceRegistrySha256: string;
  totals: {
    rows: number;
    colleges: number;
    pages: number;
    jeeMainPages: number;
    jeeAdvancedPages: number;
    programs: number;
    profiles: number;
    multiRoundProfiles: number;
    oneRoundProfiles: number;
    canonicalRoutes: number;
    indexableRoutes: number;
    sources: number;
  };
  colleges: CutoffCollegeCatalogEntry[];
};

export type SeoRouteType =
  | "entry"
  | "directory"
  | "hub"
  | "year"
  | "program"
  | "profile";

export type JeeSeoRoute = {
  routeType: SeoRouteType;
  path: string;
  examId: JeeExamId | null;
  collegeId: string | null;
  year: number | null;
  programSlug: string | null;
  offeringId: string | null;
  body: CounsellingBody | null;
  quota: string | null;
  seatType: string | null;
  gender: string | null;
  rounds: number[];
  rowCount: number;
  roundCount: number;
  indexable: boolean;
  indexReason: string;
  contentSha256: string;
  lastChangedAt: string;
  sourceIds: string[];
};

export type CutoffSourceRegistryEntry = {
  sourceId: string;
  body: CounsellingBody;
  publisher: string;
  title: string;
  year: number;
  round: number;
  instituteType: string;
  officialDomain: string;
  sourceLocator: string;
};

export type CutoffServingRow = {
  body: CounsellingBody;
  year: number;
  round: number;
  institute_id: string;
  source_program_id: string;
  source_program_name: string;
  canonical_program_id: string | null;
  offering_id: string;
  quota: string;
  seat_type: string;
  gender: string;
  opening_rank: number;
  closing_rank: number;
  exam_id: JeeExamId;
  institute_type: string;
  degree: string;
  duration_years: number;
  source: string;
  source_id: string;
  source_locator: string;
};

export type CutoffOffering = {
  id: string;
  sourceProgramId: string;
  canonicalProgramId: string | null;
  name: string;
  degree: string;
  durationYears: number;
  label: string;
};

export type CutoffSelection = {
  body: CounsellingBody;
  round: number;
  quota: string;
  seatType: string;
  gender: string;
  offeringId: string;
};

export type CutoffFilterOptions = {
  bodies: CounsellingBody[];
  rounds: number[];
  quotas: string[];
  seatTypes: string[];
  genders: string[];
  offerings: CutoffOffering[];
};

export type CutoffChartPoint = {
  label: string;
  year?: number;
  round?: number;
  openingRank: number | null;
  closingRank: number | null;
};

export type CutoffPageModel = {
  catalog: JeeCutoffCatalog;
  college: CutoffCollegeCatalogEntry;
  page: CutoffPageCatalogEntry;
  defaultSelection: CutoffSelection;
  filterOptions: CutoffFilterOptions;
  tableRows: CutoffServingRow[];
  tableTotal: number;
  chartOffering: CutoffOffering;
  programs: CutoffOffering[];
  chart: CutoffChartPoint[];
  sources: Array<{
    sourceId: string;
    body: CounsellingBody;
    label: string;
    locator: string;
  }>;
};

export type CutoffHubModel = {
  catalog: JeeCutoffCatalog;
  college: CutoffCollegeCatalogEntry;
  latestPage: CutoffPageCatalogEntry;
  selection: CutoffSelection;
  offering: CutoffOffering;
  trend: CutoffChartPoint[];
};
