import { NextRequest, NextResponse } from "next/server";
import {
  getCutoffCollege,
  getCutoffCollegeRows,
  getCutoffPageModel,
  getJeeCutoffCatalog,
  offeringFromRow,
} from "@/lib/jee-cutoffs/repository";
import { CutoffQueryError, etagFor } from "@/lib/jee-cutoffs/query";
import type { CounsellingBody, JeeExamId } from "@/lib/jee-cutoffs/types";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ exam: string; college: string }> },
) {
  try {
    const { exam, college: slug } = await context.params;
    if (exam !== "jee-main" && exam !== "jee-advanced") throw new CutoffQueryError("Unknown exam", 404, "exam_not_found");
    const catalog = await getJeeCutoffCatalog();
    const release = request.nextUrl.searchParams.get("release");
    if (!release) throw new CutoffQueryError("The release parameter is required", 400, "release_required");
    if (release !== catalog.releaseVersion) throw new CutoffQueryError("The requested release is no longer current", 409, "release_mismatch");
    const college = await getCutoffCollege(slug);
    if (!college || college.examId !== (exam as JeeExamId)) throw new CutoffQueryError("College dataset not found", 404, "dataset_not_found");
    const latestYear = college.pages[0]?.year;
    if (!latestYear) throw new CutoffQueryError("College dataset not found", 404, "dataset_not_found");
    const model = await getCutoffPageModel(college.examId, college.id, latestYear);
    if (!model) throw new CutoffQueryError("College dataset not found", 404, "dataset_not_found");
    const rows = await getCutoffCollegeRows(college);
    const body = (request.nextUrl.searchParams.get("body") ?? model.defaultSelection.body) as CounsellingBody;
    if (body !== "josaa" && body !== "csab") throw new CutoffQueryError("Invalid body", 400, "invalid_body");
    const offeringId = request.nextUrl.searchParams.get("offering") ?? model.defaultSelection.offeringId;
    const quota = request.nextUrl.searchParams.get("quota") ?? model.defaultSelection.quota;
    const seatType = request.nextUrl.searchParams.get("seatType") ?? model.defaultSelection.seatType;
    const gender = request.nextUrl.searchParams.get("gender") ?? model.defaultSelection.gender;
    const seed = rows.find((row) => row.body === body && row.offering_id === offeringId);
    if (!seed) throw new CutoffQueryError("Offering not found", 400, "invalid_offering");
    const bodyRows = rows.filter((row) => row.body === body);
    const axes = {
      quota: new Set(bodyRows.map((row) => row.quota)),
      seatType: new Set(bodyRows.map((row) => row.seat_type)),
      gender: new Set(bodyRows.map((row) => row.gender)),
    };
    if (!axes.quota.has(quota)) throw new CutoffQueryError("Invalid quota", 400, "invalid_quota");
    if (!axes.seatType.has(seatType)) throw new CutoffQueryError("Invalid seat type", 400, "invalid_seatType");
    if (!axes.gender.has(gender)) throw new CutoffQueryError("Invalid gender", 400, "invalid_gender");
    const availableYears = college.pages.map((page) => page.year);
    const firstYear = Math.min(...availableYears);
    const lastYear = Math.max(...availableYears);
    const points = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
      const year = firstYear + index;
      const candidates = rows.filter((row) => row.year === year && row.body === body && row.source_program_id === seed.source_program_id && row.degree === seed.degree && row.duration_years === seed.duration_years && row.quota === quota && row.seat_type === seatType && row.gender === gender);
      const round = candidates.length ? Math.max(...candidates.map((row) => row.round)) : null;
      const row = round === null ? undefined : candidates.find((candidate) => candidate.round === round);
      return { label: String(year), year, round, openingRank: row?.opening_rank ?? null, closingRank: row?.closing_rank ?? null };
    });
    const payload = { release: catalog.releaseVersion, college: { id: college.id, name: college.name }, offering: offeringFromRow(seed), selection: { body, quota, seatType, gender, offeringId }, points };
    const etag = etagFor(payload);
    if (request.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": CACHE_CONTROL } });
    return NextResponse.json(payload, { headers: { ETag: etag, "Cache-Control": CACHE_CONTROL } });
  } catch (error) {
    if (error instanceof CutoffQueryError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status, headers: { "Cache-Control": "no-store, max-age=0" } });
    throw error;
  }
}
