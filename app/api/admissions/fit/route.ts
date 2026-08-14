import { NextRequest, NextResponse } from "next/server";
import { AdmissionsDataError } from "@/lib/admissions/data";
import { evaluateAdmissionsFit } from "@/lib/admissions/fit";
import { FitRequestV1Schema } from "@/lib/admissions/profile";
import { isAdmissionsV2Enabled } from "@/lib/admissions/flags";
import { isRoundAvailableForYear } from "@/lib/mht-cet/state-cutoffs/config";

const MAX_REQUEST_BYTES = 16 * 1024;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: RESPONSE_HEADERS });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ error: "Content-Type must be application/json" }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return json({ error: "Request body is too large" }, 413);
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return json({ error: "Unable to read request body" }, 400);
  }
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    return json({ error: "Request body is too large" }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "Request body must contain valid JSON" }, 400);
  }
  const parsed = FitRequestV1Schema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: "Invalid fit request",
        fieldErrors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      400,
    );
  }
  if (!isAdmissionsV2Enabled(parsed.data.system)) {
    return json({ error: "Admissions fit is unavailable" }, 404);
  }
  if (
    parsed.data.system === "mht-cet" &&
    !isRoundAvailableForYear(parsed.data.round, parsed.data.year)
  ) {
    return json({ error: "Unsupported MHT-CET year and round" }, 400);
  }

  try {
    return json(await evaluateAdmissionsFit(parsed.data));
  } catch (error) {
    if (error instanceof AdmissionsDataError) {
      return json(
        {
          error: "Official cutoff data is temporarily unavailable",
          code: error.code,
        },
        503,
      );
    }
    return json({ error: "Unable to calculate historical fit" }, 500);
  }
}
