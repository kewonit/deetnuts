import { PredictionInputError } from "@ejam/data";
import type {
  MhtCetPredictionInput,
  MhtCetPredictionResult,
  MhtCetProbabilityBand,
  MhtCetProgramPrediction,
} from "@ejam/data/mht-cet";
import {
  boundariesEqual,
  decodeMhtCursor,
  encodeMhtCursor,
  type MhtCetSortBoundary,
  type MhtCetSortMode,
  mhtCetIndexIdentity,
  mhtCetRequestFingerprint,
} from "./cursor";
import { matchesMhtSearch, normalizeMhtSearchText } from "./search";

const DISPLAY_THRESHOLD = 0.1;
const BAND_ORDER: Record<MhtCetProbabilityBand, number> = {
  safe: 0,
  iffy: 1,
  delulu: 2,
  "doesnt-matter": 3,
};

function stableKey(program: MhtCetProgramPrediction): string {
  return `${program.institute_code}:${program.choice_code}:${program.offering_id}`;
}

function normalizedSortText(value: string): string {
  return normalizeMhtSearchText(value);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function mhtCetSortBoundary(
  program: MhtCetProgramPrediction,
  sort: MhtCetSortMode,
): MhtCetSortBoundary {
  if (sort === "closing-rank") {
    return [program.predicted_closing_rank, stableKey(program)];
  }
  if (sort === "institute") {
    return [
      normalizedSortText(program.institute_name),
      normalizedSortText(program.program_name),
      program.institute_code,
      program.choice_code,
      stableKey(program),
    ];
  }
  return [
    BAND_ORDER[program.band],
    -program.overall_probability,
    program.predicted_closing_rank,
    stableKey(program),
  ];
}

function compareBoundaries(
  left: MhtCetSortBoundary,
  right: MhtCetSortBoundary,
): number {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      if (leftValue !== rightValue) return leftValue - rightValue;
      continue;
    }
    const difference = compareText(String(leftValue), String(rightValue));
    if (difference !== 0) return difference;
  }
  return 0;
}

function sortedPrograms(
  programs: MhtCetProgramPrediction[],
  sort: MhtCetSortMode,
): MhtCetProgramPrediction[] {
  return [...programs].sort((left, right) =>
    compareBoundaries(
      mhtCetSortBoundary(left, sort),
      mhtCetSortBoundary(right, sort),
    ),
  );
}

function matchesFilters(
  program: MhtCetProgramPrediction,
  filters: MhtCetPredictionInput["filters"],
  ignored?: "institute_type" | "band",
): boolean {
  if (!filters) return true;
  if (
    ignored !== "institute_type" &&
    filters.institute_type?.length &&
    !filters.institute_type.includes(program.institute_type)
  ) {
    return false;
  }
  if (
    filters.district?.length &&
    !filters.district.includes(program.district)
  ) {
    return false;
  }
  if (
    filters.program_id?.length &&
    !filters.program_id.includes(program.program_id)
  ) {
    return false;
  }
  if (
    ignored !== "band" &&
    filters.band?.length &&
    !filters.band.includes(program.band)
  ) {
    return false;
  }
  return true;
}

function visiblePrograms(
  programs: MhtCetProgramPrediction[],
  includeAll: boolean,
): MhtCetProgramPrediction[] {
  return includeAll
    ? programs
    : programs.filter(
        (program) => program.overall_probability >= DISPLAY_THRESHOLD,
      );
}

function facetsFor(
  searched: MhtCetProgramPrediction[],
  input: MhtCetPredictionInput,
): MhtCetPredictionResult["metadata"]["facets"] {
  const includeAll = input.include_all === true;
  const instituteUniverse = visiblePrograms(
    searched.filter((program) =>
      matchesFilters(program, input.filters, "institute_type"),
    ),
    includeAll,
  );
  const bandUniverse = visiblePrograms(
    searched.filter((program) =>
      matchesFilters(program, input.filters, "band"),
    ),
    includeAll,
  );
  const instituteCounts = new Map<string, number>();
  for (const program of instituteUniverse) {
    instituteCounts.set(
      program.institute_type,
      (instituteCounts.get(program.institute_type) ?? 0) + 1,
    );
  }
  const bands: Record<MhtCetProbabilityBand, number> = {
    safe: 0,
    iffy: 0,
    delulu: 0,
    "doesnt-matter": 0,
  };
  for (const program of bandUniverse) bands[program.band] += 1;
  return {
    institute_types: Array.from(instituteCounts, ([value, count]) => ({
      value,
      count,
    })).sort((left, right) => compareText(left.value, right.value)),
    bands,
  };
}

export function unfilteredMhtInput(
  input: MhtCetPredictionInput,
): MhtCetPredictionInput {
  return {
    ...input,
    filters: undefined,
    include_all: true,
    result_options: undefined,
  };
}

export function processMhtCetResult(options: {
  fullResult: MhtCetPredictionResult;
  input: MhtCetPredictionInput;
  indexSha256: string;
}): MhtCetPredictionResult {
  const { fullResult, input } = options;
  const searched = fullResult.programs.filter((program) =>
    matchesMhtSearch(program, input.result_options?.search),
  );
  const matching = searched.filter((program) =>
    matchesFilters(program, input.filters),
  );
  const displayed = visiblePrograms(matching, input.include_all === true);
  const sort = input.result_options?.sort_by ?? "chance";
  const sorted = sortedPrograms(displayed, sort);
  const facets = facetsFor(searched, input);
  const baseMetadata = {
    ...fullResult.metadata,
    total_matching_offerings: matching.length,
    displayed_offerings: sorted.length,
    hidden_offerings: matching.length - sorted.length,
    facets,
  };

  if (!input.result_options) {
    return {
      programs: sorted,
      metadata: {
        ...baseMetadata,
        pagination: {
          returned: sorted.length,
          limit: null,
          next_cursor: null,
          has_more: false,
        },
      },
    };
  }

  const identity = mhtCetIndexIdentity({
    indexSha256: options.indexSha256,
    metadata: fullResult.metadata,
  });
  const fingerprint = mhtCetRequestFingerprint(input, identity);
  let startIndex = 0;
  if (input.result_options.cursor) {
    const boundary = decodeMhtCursor({
      cursor: input.result_options.cursor,
      identity,
      fingerprint,
      sort,
    });
    const boundaryIndex = sorted.findIndex((program) =>
      boundariesEqual(mhtCetSortBoundary(program, sort), boundary),
    );
    if (boundaryIndex < 0) {
      throw new PredictionInputError(
        "MHT-CET results changed; restart from the first page",
        {
          "result_options.cursor":
            "MHT-CET results changed; restart from the first page",
        },
      );
    }
    startIndex = boundaryIndex + 1;
  }

  const limit = input.result_options.limit;
  const programs = sorted.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + programs.length < sorted.length;
  const lastProgram = programs.at(-1);
  const nextCursor =
    hasMore && lastProgram
      ? encodeMhtCursor({
          identity,
          fingerprint,
          sort,
          boundary: mhtCetSortBoundary(lastProgram, sort),
        })
      : null;
  return {
    programs,
    metadata: {
      ...baseMetadata,
      pagination: {
        returned: programs.length,
        limit,
        next_cursor: nextCursor,
        has_more: hasMore,
      },
    },
  };
}
