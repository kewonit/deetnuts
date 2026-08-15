import { createHash } from "node:crypto";
import type {
  CounsellingBody,
  CutoffFilterOptions,
  CutoffSelection,
  CutoffServingRow,
} from "./types";

function bodyLabel(body: CounsellingBody): string {
  return body === "josaa" ? "JoSAA" : "CSAB";
}

function offeringFromRow(row: CutoffServingRow) {
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

export class CutoffQueryError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
    readonly code: string,
  ) {
    super(message);
  }
}

export type CutoffSort = "closing-asc" | "closing-desc" | "program-asc";

export type CutoffQuery = Partial<{
  body: string;
  offering: string;
  quota: string;
  seatType: string;
  gender: string;
  round: string;
  sort: string;
  cursor: string;
  limit: string;
}>;

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function preferred(values: string[], wanted: string[]): string {
  return wanted.find((item) => values.includes(item)) ?? values[0] ?? "";
}

function assertMember(value: string | undefined, values: string[], name: string): string | undefined {
  if (value === undefined) return undefined;
  if (!values.includes(value)) {
    throw new CutoffQueryError(`Invalid ${name}`, 400, `invalid_${name}`);
  }
  return value;
}

function filterOptions(rows: CutoffServingRow[]): CutoffFilterOptions {
  const offerings = new Map<string, ReturnType<typeof offeringFromRow>>();
  for (const row of rows) offerings.set(row.offering_id, offeringFromRow(row));
  return {
    bodies: [...new Set(rows.map((row) => row.body))].sort(),
    rounds: [...new Set(rows.map((row) => row.round))].sort((a, b) => a - b),
    quotas: unique(rows.map((row) => row.quota)),
    seatTypes: unique(rows.map((row) => row.seat_type)),
    genders: unique(rows.map((row) => row.gender)),
    offerings: [...offerings.values()].sort((a, b) => a.label.localeCompare(b.label)),
  };
}

function parseCursor(value: string | undefined): number {
  if (!value) return 0;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    if (!/^\d+$/.test(decoded)) throw new Error();
    return Number(decoded);
  } catch {
    throw new CutoffQueryError("Invalid cursor", 400, "invalid_cursor");
  }
}

function emptyResult(
  options: CutoffFilterOptions,
  selection: Partial<CutoffSelection>,
  reason: string,
) {
  return {
    selection: {
      body: selection.body ?? options.bodies[0] ?? "josaa",
      round: selection.round ?? options.rounds.at(-1) ?? 0,
      quota: selection.quota ?? options.quotas[0] ?? "",
      seatType: selection.seatType ?? options.seatTypes[0] ?? "",
      gender: selection.gender ?? options.genders[0] ?? "",
      offeringId: selection.offeringId ?? options.offerings[0]?.id ?? "",
    } satisfies CutoffSelection,
    filters: options,
    rows: [] as CutoffServingRow[],
    chart: [] as Array<{ label: string; round: number; openingRank: number; closingRank: number }>,
    sources: [],
    pagination: { total: 0, limit: 0, nextCursor: null },
    emptyReason: reason,
  };
}

export function etagFor(value: unknown): string {
  return `"${createHash("sha256").update(JSON.stringify(value)).digest("hex")}"`;
}

export function queryCutoffRows(rows: CutoffServingRow[], query: CutoffQuery) {
  const allOptions = filterOptions(rows);
  const bodies = allOptions.bodies;
  assertMember(query.body, bodies, "body");
  assertMember(query.seatType, allOptions.seatTypes, "seatType");
  assertMember(query.gender, allOptions.genders, "gender");
  assertMember(query.quota, allOptions.quotas, "quota");
  assertMember(query.offering, allOptions.offerings.map((offering) => offering.id), "offering");
  const body = (assertMember(query.body, bodies, "body") ??
    (bodies.includes("josaa") ? "josaa" : bodies[0])) as CounsellingBody;
  let scope = rows.filter((row) => row.body === body);

  const rounds = [...new Set(scope.map((row) => row.round))].sort((a, b) => a - b);
  const requestedRound = query.round === undefined ? undefined : Number(query.round);
  if (query.round !== undefined && (!Number.isInteger(requestedRound) || !allOptions.rounds.includes(requestedRound!))) {
    throw new CutoffQueryError("Invalid round", 400, "invalid_round");
  }
  if (requestedRound !== undefined && !rounds.includes(requestedRound)) {
    return emptyResult(allOptions, { body, round: requestedRound }, "That round was not published for the selected counselling body.");
  }
  const round = requestedRound ?? rounds.at(-1)!;
  scope = scope.filter((row) => row.round === round);

  const seatTypes = unique(scope.map((row) => row.seat_type));
  if (query.seatType !== undefined && !seatTypes.includes(query.seatType)) {
    return emptyResult(allOptions, { body, round, seatType: query.seatType }, "No source rows match this counselling body, round, and seat type.");
  }
  const seatType = query.seatType ??
    preferred(seatTypes, ["OPEN", "OPEN(PwD)"]);
  scope = scope.filter((row) => row.seat_type === seatType);

  const genders = unique(scope.map((row) => row.gender));
  if (query.gender !== undefined && !genders.includes(query.gender)) {
    return emptyResult(allOptions, { body, round, seatType, gender: query.gender }, "No source rows match this seat type and gender combination.");
  }
  const gender = query.gender ??
    preferred(genders, ["Gender-Neutral", "NA", "Female-only (including Supernumerary)"]);
  scope = scope.filter((row) => row.gender === gender);

  const quotas = unique(scope.map((row) => row.quota));
  if (query.quota !== undefined && !quotas.includes(query.quota)) {
    return emptyResult(allOptions, { body, round, seatType, gender, quota: query.quota }, "No source rows match this quota and seat-pool combination.");
  }
  const quota = query.quota ??
    preferred(quotas, ["AI", "OS", "HS"]);
  const tableRows = scope.filter((row) => row.quota === quota);

  const offeringIds = unique(tableRows.map((row) => row.offering_id));
  if (query.offering !== undefined && !offeringIds.includes(query.offering)) {
    return emptyResult(allOptions, { body, round, seatType, gender, quota, offeringId: query.offering }, "The selected offering has no row in this seat-pool combination.");
  }
  const offeringId = query.offering ??
    tableRows.find((row) => row.canonical_program_id === "computer-science" && /b\.?\s*tech/i.test(row.degree) && row.duration_years === 4)?.offering_id ??
    [...tableRows].sort((a, b) => offeringFromRow(a).label.localeCompare(offeringFromRow(b).label))[0]?.offering_id;
  if (!offeringId) {
    throw new CutoffQueryError("No rows match this filter combination", 404, "empty_intersection");
  }

  const sort = (query.sort ?? "closing-asc") as CutoffSort;
  if (!["closing-asc", "closing-desc", "program-asc"].includes(sort)) {
    throw new CutoffQueryError("Invalid sort", 400, "invalid_sort");
  }
  const sorted = [...tableRows].sort((a, b) => {
    const deterministic = a.source_program_name.localeCompare(b.source_program_name) || a.degree.localeCompare(b.degree) || a.duration_years - b.duration_years;
    if (sort === "program-asc") return deterministic || a.closing_rank - b.closing_rank;
    return (sort === "closing-desc" ? b.closing_rank - a.closing_rank : a.closing_rank - b.closing_rank) || a.opening_rank - b.opening_rank || deterministic;
  });

  const limit = query.limit === undefined ? 100 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new CutoffQueryError("Limit must be between 1 and 100", 400, "invalid_limit");
  }
  const offset = parseCursor(query.cursor);
  if (offset > sorted.length) throw new CutoffQueryError("Invalid cursor", 400, "invalid_cursor");
  const pageRows = sorted.slice(offset, offset + limit);
  const nextOffset = offset + pageRows.length;
  const selection: CutoffSelection = { body, round, quota, seatType, gender, offeringId };
  const chartRows = rows.filter((row) => row.body === body && row.quota === quota && row.seat_type === seatType && row.gender === gender && row.offering_id === offeringId);
  const maxChartRound = Math.max(...rows.filter((row) => row.body === body).map((row) => row.round));
  const chart = Array.from({ length: maxChartRound }, (_, index) => {
    const chartRound = index + 1;
    const row = chartRows.find((candidate) => candidate.round === chartRound);
    return { label: `R${chartRound}`, round: chartRound, openingRank: row?.opening_rank ?? null, closingRank: row?.closing_rank ?? null };
  });
  const sources = [...new Map(rows.filter((row) => row.body === body).map((row) => [row.source_locator, {
    body: row.body,
    label: `${bodyLabel(row.body)} published opening and closing ranks`,
    locator: row.source_locator,
  }])).values()];

  return {
    selection,
    filters: {
      bodies,
      rounds,
      seatTypes,
      genders,
      quotas,
      offerings: filterOptions(tableRows).offerings,
    },
    rows: pageRows,
    chart,
    sources,
    pagination: {
      total: sorted.length,
      limit,
      nextCursor: nextOffset < sorted.length ? Buffer.from(String(nextOffset)).toString("base64url") : null,
    },
    emptyReason: pageRows.length === 0 ? "No more rows for this filter combination." : null,
  };
}
