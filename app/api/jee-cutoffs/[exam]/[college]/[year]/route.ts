import { NextRequest, NextResponse } from "next/server";
import {
  getCutoffCollege,
  getCutoffCollegeRows,
  getJeeCutoffCatalog,
} from "@/lib/jee-cutoffs/repository";
import {
  CutoffQueryError,
  etagFor,
  queryCutoffRows,
} from "@/lib/jee-cutoffs/query";
import type { JeeExamId } from "@/lib/jee-cutoffs/types";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

function errorResponse(error: unknown) {
  if (error instanceof CutoffQueryError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      {
        status: error.status,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }
  throw error;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ exam: string; college: string; year: string }> },
) {
  try {
    const { exam, college: slug, year: rawYear } = await context.params;
    if (exam !== "jee-main" && exam !== "jee-advanced") {
      throw new CutoffQueryError("Unknown exam", 404, "exam_not_found");
    }
    if (!/^\d{4}$/.test(rawYear)) {
      throw new CutoffQueryError("Unknown cutoff year", 404, "year_not_found");
    }
    const catalog = await getJeeCutoffCatalog();
    const release = request.nextUrl.searchParams.get("release");
    if (!release) {
      throw new CutoffQueryError("The release parameter is required", 400, "release_required");
    }
    if (release !== catalog.releaseVersion) {
      throw new CutoffQueryError("The requested release is no longer current", 409, "release_mismatch");
    }
    const college = await getCutoffCollege(slug);
    const year = Number(rawYear);
    const page = college?.pages.find((entry) => entry.year === year);
    if (!college || college.examId !== (exam as JeeExamId) || !page) {
      throw new CutoffQueryError("Cutoff dataset not found", 404, "dataset_not_found");
    }
    const rows = (await getCutoffCollegeRows(college)).filter((row) => row.year === year);
    const result = queryCutoffRows(rows, {
      body: request.nextUrl.searchParams.get("body") ?? undefined,
      offering: request.nextUrl.searchParams.get("offering") ?? undefined,
      quota: request.nextUrl.searchParams.get("quota") ?? undefined,
      seatType: request.nextUrl.searchParams.get("seatType") ?? undefined,
      gender: request.nextUrl.searchParams.get("gender") ?? undefined,
      round: request.nextUrl.searchParams.get("round") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    const payload = {
      release: catalog.releaseVersion,
      metadata: {
        examId: college.examId,
        college: { id: college.id, name: college.name, type: college.type, city: college.city, state: college.state },
        year,
        contentSha256: page.contentSha256,
        lastChangedAt: page.lastChangedAt,
      },
      ...result,
    };
    const etag = etagFor(payload);
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": CACHE_CONTROL } });
    }
    return NextResponse.json(payload, { headers: { ETag: etag, "Cache-Control": CACHE_CONTROL } });
  } catch (error) {
    return errorResponse(error);
  }
}
