/**
 * GET/POST /api/predict/{exam_id}
 * generic prediction endpoint — config lookup, input validation, exam dispatch, standard response
 * exam-specific predictors plug in via the registry; this handler never imports exam internals
 */

import type {
  PredictionErrorResponse,
  PredictionSuccessResponse,
} from "@ejam/data";
import { PredictionInputError } from "@ejam/data";
import { decodeCollegePredictorUrlParams } from "@ejam/data/college-predictor";
import {
  buildPredictionProvenance,
  loadLatestManifest,
  resolveExamDependencies,
} from "@ejam/data/dependency-resolver";
import { loadExamConfig } from "@ejam/data/exam-config";
import {
  decodeMhtCetUrlParams,
  encodeMhtCetPagedPredictionResult,
  MhtCetPredictionResult,
} from "@ejam/data/mht-cet/browser";
import { getPredictor } from "@ejam/predictors/registry";
import { type NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ exam_id: string }> };

function errResponse(
  status: number,
  code: PredictionErrorResponse["error"]["code"],
  message: string,
  fieldErrors?: Record<string, string>,
): NextResponse<PredictionErrorResponse> {
  const body: PredictionErrorResponse = {
    ok: false,
    error: {
      code,
      message,
      ...(fieldErrors ? { field_errors: fieldErrors } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

function loadConfiguredExam(
  examId: string,
):
  | { ok: true; examConfig: Awaited<ReturnType<typeof loadExamConfig>> }
  | { ok: false; response: NextResponse<PredictionErrorResponse> } {
  try {
    return { ok: true, examConfig: loadExamConfig(examId) };
  } catch {
    return {
      ok: false,
      response: errResponse(
        404,
        "EXAM_NOT_FOUND",
        `exam "${examId}" is not configured`,
      ),
    };
  }
}

async function readPostBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

async function readInput(
  req: NextRequest,
  method: "GET" | "POST",
  examId: string,
): Promise<unknown> {
  const url = new URL(req.url);
  const queryInput = url.searchParams.has("rank")
    ? examId === "mht-cet"
      ? decodeMhtCetUrlParams(url.searchParams)
      : decodeCollegePredictorUrlParams(url.searchParams)
    : null;

  if (method === "GET") return queryInput;

  const rawBody = await readPostBody(req);
  if (rawBody && typeof rawBody === "object") {
    return {
      ...rawBody,
      ...(url.searchParams.get("include_all") === "true"
        ? { include_all: true }
        : {}),
    };
  }

  return queryInput;
}

function resolveDatasets(
  examId: string,
  examConfig: Awaited<ReturnType<typeof loadExamConfig>>,
  url: URL,
):
  | {
      ok: true;
      manifestVersion: string;
      predictorIndex: { path: string; sha256: string };
    }
  | { ok: false; response: NextResponse<PredictionErrorResponse> } {
  const manifest = loadLatestManifest();
  const yearParam = url.searchParams.get("year");
  const year = yearParam
    ? Number.parseInt(yearParam, 10)
    : new Date().getFullYear();
  const resolution = resolveExamDependencies({
    examId,
    dependencies: examConfig.data_dependencies,
    manifest,
    year,
  });
  if (!resolution.publishable) {
    const missing = resolution.missing.flatMap((m) =>
      m.required ? [m.dataset] : [],
    );
    return {
      ok: false,
      response: errResponse(
        503,
        "DEPENDENCY_UNAVAILABLE",
        `required datasets unavailable for "${examId}": ${missing.join(", ")}`,
      ),
    };
  }

  const predictorIndex = resolution.resolved.find(
    (r) => r.dataset === "predictor_index",
  );
  if (!predictorIndex) {
    return {
      ok: false,
      response: errResponse(
        503,
        "DEPENDENCY_UNAVAILABLE",
        `predictor index unavailable for "${examId}"`,
      ),
    };
  }

  return {
    ok: true,
    manifestVersion: manifest.version,
    predictorIndex: {
      path: predictorIndex.path,
      sha256: predictorIndex.sha256,
    },
  };
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}

function isMissingDependencyError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    err.code === "ENOENT"
  );
}

function buildFieldErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path.length
      ? issue.path.map(String).join(".")
      : "<root>";
    fieldErrors[path] = issue.message;
  }
  return fieldErrors;
}

function encodeResultForTransport(examId: string, result: unknown): unknown {
  if (examId !== "mht-cet") return result;
  const parsed = MhtCetPredictionResult.parse(result);
  return parsed.metadata.pagination.limit === null
    ? result
    : encodeMhtCetPagedPredictionResult(parsed);
}

function validateInput(
  input: unknown,
  inputSchema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: unknown;
      error?: {
        issues: Array<{ path: PropertyKey[]; message: string }>;
      };
    };
  },
):
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse<PredictionErrorResponse> } {
  const inputResult = inputSchema.safeParse(input);
  if (inputResult.success) {
    return { ok: true, data: inputResult.data };
  }
  if (!inputResult.error) {
    return {
      ok: false,
      response: errResponse(
        400,
        "INVALID_INPUT",
        "request body failed schema validation",
      ),
    };
  }
  const fieldErrors = buildFieldErrors(inputResult.error.issues);
  return {
    ok: false,
    response: errResponse(
      400,
      "INVALID_INPUT",
      "request body failed schema validation",
      fieldErrors,
    ),
  };
}

function unsupportedMhtCetDefenceInput(
  input: unknown,
  url: URL,
): NextResponse<PredictionErrorResponse> | null {
  if (
    url.searchParams.has("defence_category_id") ||
    url.searchParams.has("defence")
  ) {
    return errResponse(
      400,
      "INVALID_INPUT",
      "Defence reservation prediction is not supported",
      {
        "eligibilities.defence_category_id":
          "Defence reservation prediction is not supported",
      },
    );
  }
  if (
    input !== null &&
    typeof input === "object" &&
    "eligibilities" in input &&
    input.eligibilities !== null &&
    typeof input.eligibilities === "object" &&
    Object.hasOwn(input.eligibilities, "defence_category_id")
  ) {
    return errResponse(
      400,
      "INVALID_INPUT",
      "Defence reservation prediction is not supported",
      {
        "eligibilities.defence_category_id":
          "Defence reservation prediction is not supported",
      },
    );
  }
  return null;
}

async function handlePrediction(
  req: NextRequest,
  { params }: RouteParams,
  method: "GET" | "POST",
): Promise<NextResponse<PredictionSuccessResponse | PredictionErrorResponse>> {
  const { exam_id } = await params;
  const url = new URL(req.url);
  const configured = loadConfiguredExam(exam_id);
  if (!configured.ok) return configured.response;
  if (exam_id === "mht-cet" && process.env.MHT_CET_ENABLED === "false") {
    return errResponse(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "MHT-CET predictor is disabled by configuration",
    );
  }

  const predictor = await getPredictor(exam_id);
  if (!predictor) {
    return errResponse(
      501,
      "PREDICTOR_NOT_REGISTERED",
      `predictor for "${exam_id}" is not yet implemented`,
    );
  }

  const input = await readInput(req, method, exam_id);
  if (!input) {
    const message =
      method === "GET"
        ? "query params must include a valid rank"
        : "request body must be valid JSON or query params must include rank";
    return errResponse(400, "INVALID_INPUT", message);
  }
  if (exam_id === "mht-cet") {
    const defenceError = unsupportedMhtCetDefenceInput(input, url);
    if (defenceError) return defenceError;
  }

  let validationResult: ReturnType<typeof validateInput>;
  try {
    validationResult = validateInput(input, predictor.inputSchema);
  } catch (err) {
    return errResponse(
      500,
      "INTERNAL_ERROR",
      `input validation failed: ${getErrorMessage(err)}`,
    );
  }
  if (!validationResult.ok) return validationResult.response;

  let dependencyResult: ReturnType<typeof resolveDatasets>;
  try {
    dependencyResult = resolveDatasets(exam_id, configured.examConfig, url);
  } catch (err) {
    const msg = getErrorMessage(err);
    if (exam_id === "mht-cet") {
      return errResponse(
        503,
        "DEPENDENCY_UNAVAILABLE",
        `MHT-CET data manifest is unavailable: ${msg}`,
      );
    }
    return errResponse(
      500,
      "INTERNAL_ERROR",
      `dependency resolution failed: ${msg}`,
    );
  }
  if (!dependencyResult.ok) return dependencyResult.response;

  try {
    const { result } = await predictor.predict(validationResult.data, {
      resolvedDatasets: [
        { dataset: "predictor_index", ...dependencyResult.predictorIndex },
      ],
      examId: exam_id,
    });

    const body: PredictionSuccessResponse = {
      ok: true,
      exam_id,
      result: encodeResultForTransport(exam_id, result),
      provenance: buildPredictionProvenance({
        examId: exam_id,
        manifestVersion: dependencyResult.manifestVersion,
        predictorIndex: dependencyResult.predictorIndex,
      }),
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    if (err instanceof PredictionInputError) {
      return errResponse(400, "INVALID_INPUT", err.message, err.fieldErrors);
    }
    if (isMissingDependencyError(err)) {
      return errResponse(
        503,
        "DEPENDENCY_UNAVAILABLE",
        `predictor data is unavailable for "${exam_id}"`,
      );
    }
    console.error(`prediction failed for "${exam_id}"`, err);
    return errResponse(500, "INTERNAL_ERROR", "prediction failed");
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  params: RouteParams,
): Promise<NextResponse<PredictionSuccessResponse | PredictionErrorResponse>> {
  try {
    return await handlePrediction(req, params, "POST");
  } catch (err) {
    return errResponse(500, "INTERNAL_ERROR", getErrorMessage(err));
  }
}

export async function GET(
  req: NextRequest,
  params: RouteParams,
): Promise<NextResponse<PredictionSuccessResponse | PredictionErrorResponse>> {
  try {
    return await handlePrediction(req, params, "GET");
  } catch (err) {
    return errResponse(500, "INTERNAL_ERROR", getErrorMessage(err));
  }
}
