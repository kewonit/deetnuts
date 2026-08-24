import { createHash } from "node:crypto";
import type {
  MhtCetPredictionInput,
  MhtCetPredictionResult,
} from "@ejam/data/mht-cet";
import { PredictionInputError } from "@ejam/data/predictor-interface";
import { z } from "zod4";
import { normalizeMhtSearchText } from "./search";

export type MhtCetSortMode = "chance" | "closing-rank" | "institute";
export type MhtCetSortBoundary = Array<string | number>;

const CURSOR_VERSION = 1;
const CURSOR_NAMESPACE = "ejam:mht-cet:cursor:v1";

const CursorPayload = z.object({
  v: z.literal(CURSOR_VERSION),
  identity: z.string().regex(/^[a-f0-9]{64}$/),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  sort: z.enum(["chance", "closing-rank", "institute"]),
  boundary: z
    .array(z.union([z.string(), z.number().finite()]))
    .min(2)
    .max(6),
});

const CursorEnvelope = z.object({
  payload: CursorPayload,
  digest: z.string().regex(/^[a-f0-9]{64}$/),
});

type CursorPayloadType = z.infer<typeof CursorPayload>;

function canonicalize(value: unknown): string {
  if (value === undefined) return "null";
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizedFilters(input: MhtCetPredictionInput) {
  const filters = input.filters;
  if (!filters) return undefined;
  const sorted = (values: string[] | undefined) =>
    values ? Array.from(new Set(values)).sort() : undefined;
  return {
    institute_type: sorted(filters.institute_type),
    district: sorted(filters.district),
    program_id: sorted(filters.program_id),
    band: sorted(filters.band),
  };
}

export function mhtCetIndexIdentity(options: {
  indexSha256: string;
  metadata: MhtCetPredictionResult["metadata"];
}): string {
  return sha256(
    canonicalize({
      model_id: options.metadata.model_id,
      rules_year: options.metadata.rules_year,
      index_sha256: options.indexSha256,
    }),
  );
}

export function mhtCetRequestFingerprint(
  input: MhtCetPredictionInput,
  identity: string,
): string {
  return sha256(
    canonicalize({
      identity,
      rank: input.rank,
      candidature_type_id: input.candidature_type_id,
      category_id: input.category_id,
      ladies_seat_eligible: input.ladies_seat_eligible,
      home_university_id: input.home_university_id,
      eligibilities: input.eligibilities,
      filters: normalizedFilters(input),
      include_all: input.include_all === true,
      search: normalizeMhtSearchText(input.result_options?.search ?? ""),
      sort_by: input.result_options?.sort_by ?? "chance",
    }),
  );
}

function digestPayload(payload: CursorPayloadType): string {
  return sha256(`${CURSOR_NAMESPACE}:${canonicalize(payload)}`);
}

function invalidCursor(message: string): PredictionInputError {
  return new PredictionInputError(message, {
    "result_options.cursor": message,
  });
}

export function encodeMhtCursor(options: {
  identity: string;
  fingerprint: string;
  sort: MhtCetSortMode;
  boundary: MhtCetSortBoundary;
}): string {
  const payload: CursorPayloadType = {
    v: CURSOR_VERSION,
    identity: options.identity,
    fingerprint: options.fingerprint,
    sort: options.sort,
    boundary: options.boundary,
  };
  const envelope = { payload, digest: digestPayload(payload) };
  return Buffer.from(canonicalize(envelope), "utf8").toString("base64url");
}

export function decodeMhtCursor(options: {
  cursor: string;
  identity: string;
  fingerprint: string;
  sort: MhtCetSortMode;
}): MhtCetSortBoundary {
  let decoded: unknown;
  try {
    decoded = JSON.parse(
      Buffer.from(options.cursor, "base64url").toString("utf8"),
    );
  } catch {
    throw invalidCursor("MHT-CET result cursor is malformed");
  }

  const parsed = CursorEnvelope.safeParse(decoded);
  if (!parsed.success) {
    throw invalidCursor("MHT-CET result cursor has an unsupported format");
  }
  if (parsed.data.digest !== digestPayload(parsed.data.payload)) {
    throw invalidCursor("MHT-CET result cursor failed its integrity check");
  }
  if (parsed.data.payload.identity !== options.identity) {
    throw invalidCursor("MHT-CET results changed; restart from the first page");
  }
  if (
    parsed.data.payload.fingerprint !== options.fingerprint ||
    parsed.data.payload.sort !== options.sort
  ) {
    throw invalidCursor(
      "MHT-CET result cursor does not match the current request",
    );
  }
  return parsed.data.payload.boundary;
}

export function boundariesEqual(
  left: MhtCetSortBoundary,
  right: MhtCetSortBoundary,
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
