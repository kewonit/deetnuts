#!/usr/bin/env tsx
/**
 * Import one locally scraped 2026 MAHACET CAP round into PocketBase.
 *
 * Input is an archive written by
 *   python3 scripts/scrape_mahacet_allotments.py --round N --output <dir>
 * It must have passed the scraper's strict verification. The importer reuses
 * the Round I normalization (seat-pool sections, ORPHAN merge, MI parent
 * sections) and writes two collections per round:
 *   - 2026_mht_cet_round_{one..four}_cutoffs  Maharashtra state seats
 *   - 2026_all_india_rounds_{one..four}        All India seats, one row per choice code
 * The Round I state collection is already live and is never written here; for
 * --round 1 the derived state rows are only diffed against it.
 *
 * From CAP-II on, vacant minority seats are released to non-minority
 * candidates. MI-MH seats (Maharashtra candidates, state merit) are stored as
 * category "MI-MH" in the MAHARASHTRA_STATE section, matching how the 2025
 * tables keep minority-to-Maharashtra seats. MI-AI seats (All India merit) go
 * to the All India collection as their own seat type.
 *
 * Dry run by default (it still reads PocketBase for the Round I reference).
 * Pass --apply to create missing collections and upsert rows. Connects to
 * POCKETBASE_IMPORT_URL (default http://127.0.0.1:8090, the admin SSH tunnel)
 * as a superuser from POCKETBASE_SUPERUSER_EMAIL/PASSWORD, falling back to
 * POCKETBASE_ADMIN_EMAIL/PASSWORD in .env.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { parse } from "csv-parse/sync";
import * as dotenv from "dotenv";
import PocketBase, { type CollectionModel } from "pocketbase";
import { sourceTargetField } from "../lib/pocketbase/source-record";

type CsvRow = Record<string, string>;
type Round = 1 | 2 | 3 | 4;

const SOURCE_INDEX_URL =
  "https://fe2026.mahacet.org/StaticPages/frmInstituteWiseAllotmentList?did=2021";
const ROUND_WORDS: Record<Round, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
};
const ROUND_NUMERALS: Record<Round, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};
const ROUND_ONE_STATE_COLLECTION = "2026_mht_cet_round_one_cutoffs";
const ALL_INDIA_TEMPLATE_COLLECTION = "2024_all_india_rounds_one";
const SERVICE_RULE =
  '@request.auth.collectionName = "app_services" && @request.auth.role = "backend"';
const WRITE_CONCURRENCY = 6;
// The app's PocketBase adapter (lib/pocketbase/source-record.ts) maps the app-level
// id/created/updated to these fields on every migrated data collection and sorts by
// the id one, so new collections must carry them too.
const SOURCE_ID_FIELD = sourceTargetField("id");
const SOURCE_CREATED_FIELD = sourceTargetField("created");
const SOURCE_UPDATED_FIELD = sourceTargetField("updated");
const IMPORTED_AT = new Date().toISOString();
const repositoryRoot = resolve(__dirname, "..");

const HOME_UNIVERSITY_IDS: Record<string, string> = {
  "Dr. Babasaheb Ambedkar Marathwada University":
    "dr-babasaheb-ambedkar-marathwada-university",
  "Swami Ramanand Teerth Marathwada University, Nanded":
    "swami-ramanand-teerth-marathwada-university-nanded",
  "Mumbai University": "mumbai-university",
  "Kavayitri Bahinabai Chaudhari North Maharashtra":
    "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
  "Kavayitri Bahinabai Chaudhari North Maharashtra University, Jalgaon":
    "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
  "Savitribai Phule Pune University": "savitribai-phule-pune-university",
  "Shivaji University": "shivaji-university",
  "Punyashlok Ahilyadevi Holkar Solapur University":
    "punyashlok-ahilyadevi-holkar-solapur-university",
  "Sant Gadge Baba Amravati University": "sant-gadge-baba-amravati-university",
  "Rashtrasant Tukadoji Maharaj Nagpur University":
    "rashtrasant-tukadoji-maharaj-nagpur-university",
  "Gondwana University": "gondwana-university",
};

const MINORITY_IDS: Record<string, string> = {
  Gujar: "official-linguistic-minority-gujar",
  Gujarathi: "official-linguistic-minority-gujarathi",
  "Gujarathi(Jain)": "official-linguistic-minority-gujarathi-jain",
  Hindi: "official-linguistic-minority-hindi",
  Malyalam: "official-linguistic-minority-malyalam",
  Punjabi: "official-linguistic-minority-punjabi",
  Sindhi: "official-linguistic-minority-sindhi",
  Tamil: "official-linguistic-minority-tamil",
  Christian: "official-religious-minority-christian",
  Jain: "official-religious-minority-jain",
  Muslim: "official-religious-minority-muslim",
  "Roman Catholics": "official-religious-minority-roman-catholics",
};

const STATE_SECTIONS = [
  "HOME_TO_HOME",
  "HOME_TO_OTHER",
  "OTHER_TO_HOME",
  "OTHER_TO_OTHER",
  "STATE_LEVEL",
] as const;

const EXAM_LABELS: Record<string, string> = {
  JEE_MAIN: "JEE(Main)-2026",
  MHT_CET: "MHT-CET",
  // A few blocks are headed only "All India Candidature Candidates". Their merit
  // numbers sit in the same combined All India list, but the exam is not printed.
  UNSPECIFIED: "Not stated",
};

type StateRecord = {
  source_key: string;
  college_code: string;
  college_name: string;
  course_code: string;
  course_name: string;
  category: string;
  seat_allocation_section: string;
  cutoff_score: number;
  last_rank: number;
  total_admitted: number;
  status: string;
  home_university: string;
  institute_home_university_id: string;
  affiliating_university_id: string | null;
  minority_community_id: string | null;
  source_pdf: string;
  source_page: number;
  source_serial_no: number;
  source_pdf_sha256: string;
  source_index_url: string;
};

type AllIndiaRecord = {
  source_key: string;
  rank: number;
  percentile: number;
  choice_code: string;
  institute_code: string;
  merit_exam: string;
  type: string;
  seat_type: string;
  college_code: string;
  college_name: string;
  course_name: string;
  total_admitted: number;
  admitted_by_exam: string;
  source_pdf: string;
  source_page: number;
  source_serial_no: number;
  source_pdf_sha256: string;
  source_index_url: string;
};

type Eligibility = {
  institute_home_university_id: string;
  affiliating_university_id: string | null;
  minority_community_id: string | null;
};

const readCsv = (path: string): CsvRow[] =>
  parse(readFileSync(path), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: false,
  }) as CsvRow[];

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(path, "utf8")) as T;

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

/** PocketBase ids are 15 chars of [a-z0-9]; hex is a subset, so derive them from the stable key. */
const recordIdFor = (sourceKey: string): string => sha256(sourceKey).slice(0, 15);

const parsePositiveInteger = (value: string, label: string): number => {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} is not an integer: ${JSON.stringify(value)}`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} is outside the positive safe-integer range`);
  }
  return parsed;
};

const parseScore = (value: string): number => {
  if (!/^\d{1,3}(?:\.\d+)?$/.test(value)) {
    throw new Error(`Invalid score: ${JSON.stringify(value)}`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`Score is outside 0..100: ${value}`);
  }
  return parsed;
};

const stripLeadingZeros = (code: string): string => code.replace(/^0+(?=\d)/, "");

const minorityIdFromStatus = (status: string): string | null => {
  const marker = "Minority - ";
  const markerIndex = status.indexOf(marker);
  if (markerIndex < 0) return null;
  const community = status.slice(markerIndex + marker.length);
  const id = MINORITY_IDS[community];
  if (!id) throw new Error(`Unmapped minority status: ${status}`);
  return id;
};

const normalizeCategory = (category: string): string => {
  if (category === "ORPHANI" || category === "ORPHANN") return "ORPHAN";
  if (category === "MI-MH") return category;
  if (!/^[A-Z0-9]+$/.test(category)) {
    throw new Error(`Invalid seat category: ${JSON.stringify(category)}`);
  }
  return category;
};

const normalizeAllocationSection = (row: CsvRow, category: string): string => {
  if (category === "MI-MH") {
    if (row.allocation_section !== "MINORITY_TO_MAHARASHTRA") {
      throw new Error(`MI-MH seat under unexpected section ${row.allocation_section}`);
    }
    return "MAHARASHTRA_STATE";
  }
  if (row.allocation_section === "MINORITY_TO_MAHARASHTRA") {
    throw new Error(`Seat type ${category} under the MI-MH section`);
  }
  if (category === "EWS" || category === "TFWS" || category === "ORPHAN") {
    return "STATE_LEVEL";
  }
  if (category === "MI") {
    switch (row.parent_allocation_section) {
      case "HOME_TO_HOME":
      case "OTHER_TO_HOME":
        return "HOME_TO_HOME";
      case "HOME_TO_OTHER":
      case "OTHER_TO_OTHER":
        return "OTHER_TO_OTHER";
      case "STATE_LEVEL":
        return "STATE_LEVEL";
      default:
        throw new Error(
          `Minority cutoff has invalid parent section ${JSON.stringify(row.parent_allocation_section)}`,
        );
    }
  }
  if (!(STATE_SECTIONS as readonly string[]).includes(row.allocation_section)) {
    throw new Error(`Unsupported state allocation section: ${row.allocation_section}`);
  }
  return row.allocation_section;
};

function parseCli() {
  const { values } = parseArgs({
    options: {
      round: { type: "string" },
      archive: { type: "string" },
      apply: { type: "boolean", default: false },
    },
    strict: true,
  });
  const round = Number(values.round);
  if (![1, 2, 3, 4].includes(round)) throw new Error("--round must be 1, 2, 3 or 4");
  if (!values.archive) throw new Error("--archive <dir> is required");
  const archive = resolve(values.archive);
  if (!existsSync(resolve(archive, "manifests/verification.json"))) {
    throw new Error(`No scraper archive at ${archive}`);
  }
  return { round: round as Round, archive, apply: values.apply === true };
}

function loadArchive(archive: string, round: Round) {
  const verification = readJson<Record<string, unknown>>(
    resolve(archive, "manifests/verification.json"),
  );
  if (
    verification.source_url !== SOURCE_INDEX_URL ||
    verification.round !== round ||
    verification.verified !== true ||
    verification.complete_source_run !== true ||
    verification.download_failures !== 0 ||
    verification.extraction_issue_count !== 0 ||
    verification.row_count_matches_cap_seats !== true
  ) {
    throw new Error(
      `The Round ${ROUND_NUMERALS[round]} archive has not passed complete strict verification; refusing to import`,
    );
  }
  const downloads = readJson<
    Array<{ pdf_filename: string; sha256?: string; status: string }>
  >(resolve(archive, "manifests/downloads.json"));
  const pdfPattern = new RegExp(`^CAPR-${ROUND_NUMERALS[round]}_\\d{5}\\.pdf$`);
  const pdfSha256 = new Map<string, string>();
  for (const download of downloads) {
    if (download.status === "not_found") continue;
    if (
      !["downloaded", "reused"].includes(download.status) ||
      !pdfPattern.test(download.pdf_filename) ||
      !/^[0-9a-f]{64}$/.test(download.sha256 ?? "")
    ) {
      throw new Error(`Unverified download record: ${download.pdf_filename}`);
    }
    pdfSha256.set(download.pdf_filename, download.sha256 as string);
  }
  if (pdfSha256.size !== verification.extracted_pdf_count) {
    throw new Error("Download manifest does not match the extracted PDF count");
  }
  return {
    verification,
    pdfSha256,
    courses: readCsv(resolve(archive, "cleaned/courses.csv")),
    stateCutoffs: readCsv(resolve(archive, "cleaned/derived_cutoffs.csv")),
    allIndiaCutoffs: readCsv(resolve(archive, "cleaned/derived_all_india_cutoffs.csv")),
  };
}

function indexCourses(courses: CsvRow[]) {
  const courseByKey = new Map<string, CsvRow>();
  const homeUniversityIds = new Map<string, Set<string>>();
  for (const course of courses) {
    if (
      !/^\d{5}$/.test(course.institute_code) ||
      !/^\d{10}[A-Z]{0,3}$/.test(course.choice_code) ||
      !course.institute_name ||
      !course.course_name ||
      !course.institute_status ||
      !course.home_university
    ) {
      throw new Error(
        `Course metadata is incomplete or malformed: ${course.institute_code}:${course.choice_code}`,
      );
    }
    parsePositiveInteger(course.cap_seats, "course cap_seats");
    const key = [course.institute_code, course.choice_code, course.course_variant].join(":");
    if (courseByKey.has(key)) throw new Error(`Duplicate course metadata key: ${key}`);
    courseByKey.set(key, course);
    const homeId = HOME_UNIVERSITY_IDS[course.home_university];
    if (homeId) {
      const ids = homeUniversityIds.get(course.institute_code) ?? new Set<string>();
      ids.add(homeId);
      homeUniversityIds.set(course.institute_code, ids);
    }
  }
  for (const [code, ids] of homeUniversityIds) {
    if (ids.size !== 1) {
      throw new Error(`Institute ${code} has conflicting home universities: ${[...ids].join(", ")}`);
    }
  }
  return { courseByKey, homeUniversityIds };
}

/**
 * Latest published (2024/2025) eligibility IDs per institute, generated by
 * scripts/generate-mht-cet-eligibility-map.ts. Used for institutes that have
 * no live Round I rows and whose 2026 list prints "Autonomous Institute".
 */
function loadPublishedEligibility(): Map<string, Eligibility> {
  const generated = readJson<{
    institutes: Array<Eligibility & { year: number; institute_code: string }>;
  }>(resolve(repositoryRoot, "lib/mht-cet/state-cutoffs/institute-eligibility.generated.json"));
  const latest = new Map<string, Eligibility & { year: number }>();
  for (const record of generated.institutes) {
    const existing = latest.get(record.institute_code);
    if (!existing || record.year > existing.year) latest.set(record.institute_code, record);
  }
  return new Map(
    [...latest].map(([code, record]) => [
      code,
      {
        institute_home_university_id: record.institute_home_university_id,
        affiliating_university_id: record.affiliating_university_id ?? null,
        minority_community_id: record.minority_community_id ?? null,
      },
    ]),
  );
}

/** Per-college eligibility IDs as stored on the live Round I rows. */
async function loadRoundOneReference(pb: PocketBase) {
  const rows = await pb.collection(ROUND_ONE_STATE_COLLECTION).getFullList({
    batch: 1000,
    fields:
      "college_code,college_name,course_code,category,seat_allocation_section,cutoff_score,last_rank,total_admitted,institute_home_university_id,affiliating_university_id,minority_community_id,migration_source_key",
  });
  const eligibility = new Map<string, Eligibility>();
  // The official index later re-spelled some names (e.g. dropped apostrophes); keep Round I's.
  const collegeNames = new Map<string, string>();
  for (const row of rows) {
    collegeNames.set(row.college_code, row.college_name);
    const value: Eligibility = {
      institute_home_university_id: row.institute_home_university_id,
      affiliating_university_id: row.affiliating_university_id || null,
      minority_community_id: row.minority_community_id || null,
    };
    const existing = eligibility.get(row.college_code);
    if (existing && JSON.stringify(existing) !== JSON.stringify(value)) {
      throw new Error(`Round I rows disagree on eligibility IDs for college ${row.college_code}`);
    }
    eligibility.set(row.college_code, value);
  }
  return { rows, eligibility, collegeNames };
}

function buildStateRecords(
  round: Round,
  archive: ReturnType<typeof loadArchive>,
  eligibilityByCollege: Map<string, Eligibility>,
  collegeNames: Map<string, string>,
) {
  const { courseByKey, homeUniversityIds } = indexCourses(archive.courses);
  const publishedEligibility = loadPublishedEligibility();
  const groups = new Map<string, StateRecord>();
  let excludedVacantGroups = 0;
  let excludedAllIndiaGroups = 0;
  let includedAdmittedSeats = 0;
  const excludedUnrankedGroups: string[] = [];
  const collegesWithoutRoundOne = new Set<string>();

  for (const row of archive.stateCutoffs) {
    if (row.total_admitted === "0") {
      excludedVacantGroups += 1;
      continue;
    }
    if (
      row.exam !== "MHT_CET" ||
      row.allocation_section === "ALL_INDIA" ||
      row.allocation_section === "MINORITY_TO_ALL_INDIA" ||
      row.allocation_section === "MAHARASHTRA_TO_ALL_INDIA" ||
      row.allocation_section === "DIPLOMA"
    ) {
      excludedAllIndiaGroups += 1;
      continue;
    }
    if (!/^\d+$/.test(row.last_rank) || Number(row.last_rank) === 0) {
      // The official list prints merit number 0 for a handful of candidates; a group
      // whose only admitted candidate has no merit number has no usable cutoff.
      excludedUnrankedGroups.push(
        `${row.institute_code}:${row.choice_code}:${row.seat_type}:${row.allocation_section}`,
      );
      continue;
    }
    const totalAdmitted = parsePositiveInteger(row.total_admitted, "total_admitted");
    const courseKey = [row.institute_code, row.choice_code, row.course_variant].join(":");
    const course = courseByKey.get(courseKey);
    if (!course) throw new Error(`Cutoff has no exact course metadata match: ${courseKey}`);
    if (course.institute_name !== row.institute_name || course.course_name !== row.course_name) {
      throw new Error(`Cutoff/course metadata mismatch: ${courseKey}`);
    }

    const collegeCode = stripLeadingZeros(row.institute_code);
    const minorityCommunityId = minorityIdFromStatus(course.institute_status);
    let eligibility = eligibilityByCollege.get(collegeCode);
    if (!eligibility) {
      // Not in Round I: fall back to the published 2024/2025 mapping, then to the
      // home university printed on the 2026 list. Never guess beyond that.
      collegesWithoutRoundOne.add(collegeCode);
      const homeId = [...(homeUniversityIds.get(row.institute_code) ?? [])][0];
      const published = publishedEligibility.get(row.institute_code);
      if (published) {
        if (homeId && homeId !== published.institute_home_university_id) {
          throw new Error(`2026 home university for ${collegeCode} conflicts with the published mapping`);
        }
        eligibility = published;
      } else if (homeId) {
        eligibility = {
          institute_home_university_id: homeId,
          affiliating_university_id: null,
          minority_community_id: minorityCommunityId,
        };
      } else {
        throw new Error(
          `College ${collegeCode} is not in Round I and has no home-university mapping for ${course.home_university}`,
        );
      }
      eligibilityByCollege.set(collegeCode, eligibility);
    }
    if (eligibility.minority_community_id !== minorityCommunityId) {
      throw new Error(
        `Round ${ROUND_NUMERALS[round]} minority status for ${collegeCode} differs from Round I`,
      );
    }

    const category = normalizeCategory(row.seat_type);
    const section = normalizeAllocationSection(row, category);
    if ((category === "MI" || category === "MI-MH") && !minorityCommunityId) {
      throw new Error(`${category} cutoff belongs to non-minority institute ${row.institute_code}`);
    }
    if (row.allocation_section === "EWS" && category !== "EWS") {
      throw new Error(`EWS section contains non-EWS category ${category}`);
    }
    const sourcePdfSha256 = archive.pdfSha256.get(row.cutoff_source_pdf);
    if (!sourcePdfSha256 || row.cutoff_source_pdf !== `CAPR-${ROUND_NUMERALS[round]}_${row.institute_code}.pdf`) {
      throw new Error(`Cutoff references an unexpected PDF: ${row.cutoff_source_pdf}`);
    }

    const normalizedKey = [row.institute_code, row.choice_code, category, section].join("|");
    const candidate: StateRecord = {
      // Same key scheme as the Round I import, so Round I rows can be compared by key.
      source_key: `26r${round}_${sha256(normalizedKey).slice(0, 24)}`,
      college_code: collegeCode,
      college_name: collegeNames.get(collegeCode) ?? row.institute_name,
      course_code: row.choice_code,
      course_name: row.course_name,
      category,
      seat_allocation_section: section,
      cutoff_score: parseScore(row.cutoff_score),
      last_rank: parsePositiveInteger(row.last_rank, "last_rank"),
      total_admitted: totalAdmitted,
      status: course.institute_status,
      home_university: course.home_university,
      ...eligibility,
      source_pdf: row.cutoff_source_pdf,
      source_page: parsePositiveInteger(row.cutoff_source_page, "cutoff_source_page"),
      source_serial_no: parsePositiveInteger(row.cutoff_source_serial_no, "cutoff_source_serial_no"),
      source_pdf_sha256: sourcePdfSha256,
      source_index_url: SOURCE_INDEX_URL,
    };

    const existing = groups.get(normalizedKey);
    if (!existing) {
      groups.set(normalizedKey, candidate);
    } else {
      if (
        existing.college_name !== candidate.college_name ||
        existing.course_name !== candidate.course_name ||
        existing.status !== candidate.status ||
        existing.home_university !== candidate.home_university
      ) {
        throw new Error(`Normalized group metadata conflict: ${normalizedKey}`);
      }
      existing.total_admitted += candidate.total_admitted;
      if (candidate.last_rank > existing.last_rank) {
        existing.cutoff_score = candidate.cutoff_score;
        existing.last_rank = candidate.last_rank;
        existing.source_pdf = candidate.source_pdf;
        existing.source_page = candidate.source_page;
        existing.source_serial_no = candidate.source_serial_no;
        existing.source_pdf_sha256 = candidate.source_pdf_sha256;
      }
    }
    includedAdmittedSeats += totalAdmitted;
  }

  const records = [...groups.values()].sort((a, b) => a.source_key.localeCompare(b.source_key));
  const admitted = records.reduce((sum, record) => sum + record.total_admitted, 0);
  if (records.length === 0 || admitted !== includedAdmittedSeats) {
    throw new Error("State records are empty or seat totals changed during normalization");
  }
  return {
    records,
    summary: {
      source_cutoff_groups: archive.stateCutoffs.length,
      excluded_vacant_groups: excludedVacantGroups,
      excluded_all_india_or_non_mht_groups: excludedAllIndiaGroups,
      excluded_unranked_groups: excludedUnrankedGroups,
      state_rows: records.length,
      state_admitted_seats: admitted,
      colleges_without_round_one_reference: [...collegesWithoutRoundOne].sort(),
    },
  };
}

function buildAllIndiaRecords(
  round: Round,
  archive: ReturnType<typeof loadArchive>,
  collegeNames: Map<string, string>,
) {
  const records: AllIndiaRecord[] = archive.allIndiaCutoffs.map((row) => {
    if (row.seat_type !== "AI" && row.seat_type !== "MI-AI") {
      throw new Error(`Unexpected All India seat type ${row.seat_type}`);
    }
    const sourcePdfSha256 = archive.pdfSha256.get(row.cutoff_source_pdf);
    if (!sourcePdfSha256) throw new Error(`Unknown PDF ${row.cutoff_source_pdf}`);
    const meritExam = EXAM_LABELS[row.exam];
    if (!meritExam) throw new Error(`Unmapped All India merit exam ${row.exam}`);
    const key = [row.institute_code, row.choice_code, row.course_variant, row.seat_type].join("|");
    return {
      source_key: `26ai${round}_${sha256(key).slice(0, 24)}`,
      rank: parsePositiveInteger(row.last_rank, "All India last_rank"),
      percentile: parseScore(row.cutoff_score),
      choice_code: row.choice_code,
      institute_code: row.institute_code,
      merit_exam: meritExam,
      type: row.seat_type === "AI" ? "AI to AI" : "MI to AI",
      seat_type: row.seat_type,
      college_code: stripLeadingZeros(row.institute_code),
      college_name: collegeNames.get(stripLeadingZeros(row.institute_code)) ?? row.institute_name,
      course_name: row.course_name,
      total_admitted: parsePositiveInteger(row.total_admitted, "All India total_admitted"),
      admitted_by_exam: row.admitted_by_exam,
      source_pdf: row.cutoff_source_pdf,
      source_page: parsePositiveInteger(row.cutoff_source_page, "cutoff_source_page"),
      source_serial_no: parsePositiveInteger(row.cutoff_source_serial_no, "cutoff_source_serial_no"),
      source_pdf_sha256: sourcePdfSha256,
      source_index_url: SOURCE_INDEX_URL,
    };
  });
  if (new Set(records.map((record) => record.source_key)).size !== records.length) {
    throw new Error("Duplicate All India source keys");
  }
  return records.sort((a, b) => a.source_key.localeCompare(b.source_key));
}

function compareWithRoundOne(
  records: StateRecord[],
  liveRows: Awaited<ReturnType<typeof loadRoundOneReference>>["rows"],
) {
  const live = new Map<string, (typeof liveRows)[number]>();
  for (const row of liveRows) {
    const keys = JSON.parse(row.migration_source_key || "[]") as string[];
    for (const key of keys) live.set(key, row);
  }
  const derived = new Map(records.map((record) => [record.source_key, record]));
  const valueDiffs: Array<Record<string, unknown>> = [];
  for (const [key, record] of derived) {
    const row = live.get(key);
    if (!row) continue;
    if (
      Number(row.last_rank) !== record.last_rank ||
      Number(row.cutoff_score) !== record.cutoff_score ||
      Number(row.total_admitted) !== record.total_admitted
    ) {
      valueDiffs.push({
        key,
        college_code: record.college_code,
        course_code: record.course_code,
        category: record.category,
        section: record.seat_allocation_section,
        live: [row.last_rank, row.cutoff_score, row.total_admitted],
        derived: [record.last_rank, record.cutoff_score, record.total_admitted],
      });
    }
  }
  const onlyDerived = [...derived.keys()].filter((key) => !live.has(key));
  const onlyLive = [...live.keys()].filter((key) => !derived.has(key));
  return {
    live_rows: live.size,
    derived_rows: derived.size,
    matching_keys: derived.size - onlyDerived.length,
    value_differences: valueDiffs.length,
    only_in_derived: onlyDerived.length,
    only_in_live: onlyLive.length,
    only_in_derived_colleges: [
      ...new Set(onlyDerived.map((key) => derived.get(key)?.college_code)),
    ].sort(),
    sample_value_differences: valueDiffs.slice(0, 10),
  };
}

type FieldDefinition = Record<string, unknown> & { name: string; type: string };

const textField = (name: string, required = false): FieldDefinition => ({
  name,
  type: "text",
  required,
  presentable: false,
  hidden: false,
  system: false,
  primaryKey: false,
  min: 0,
  max: 0,
  pattern: "",
  autogeneratePattern: "",
});

const numberField = (name: string, onlyInt: boolean): FieldDefinition => ({
  name,
  type: "number",
  required: false,
  presentable: false,
  hidden: false,
  system: false,
  onlyInt,
  min: null,
  max: null,
});

/** Copy a live collection's fields, keeping the source_reserved_* id mapping but
 * dropping one-off Supabase migration bookkeeping and the template's field ids. */
function cloneFields(template: CollectionModel, drop: Set<string>): FieldDefinition[] {
  const fields = (template.fields as FieldDefinition[])
    .filter(
      (field) =>
        !field.system && !drop.has(field.name) && !field.name.startsWith("migration_"),
    )
    .map(({ id: _id, ...field }) => ({ ...field }) as FieldDefinition);
  for (const required of [SOURCE_ID_FIELD, SOURCE_CREATED_FIELD, SOURCE_UPDATED_FIELD]) {
    if (!fields.some((field) => field.name === required)) {
      throw new Error(`Template ${template.name} lacks ${required}`);
    }
  }
  return fields;
}

/** Create the collection, or add any fields an earlier version of this script left out. */
async function ensureCollection(
  pb: PocketBase,
  definition: { name: string; fields: FieldDefinition[] } & Record<string, unknown>,
) {
  if (!(await collectionExists(pb, definition.name))) {
    await pb.collections.create(definition);
    console.log(`Created collection ${definition.name}`);
    return;
  }
  const current = await pb.collections.getOne(definition.name);
  const names = new Set((current.fields as FieldDefinition[]).map((field) => field.name));
  const missing = definition.fields.filter((field) => !names.has(field.name));
  if (missing.length > 0) {
    await pb.collections.update(definition.name, { fields: [...current.fields, ...missing] });
    console.log(`Added ${missing.map((field) => field.name).join(", ")} to ${definition.name}`);
  }
}

function indexStatements(name: string, columns: string[][]): string[] {
  const prefix = `idx_${sha256(name).slice(0, 8)}`;
  return [
    ...columns.map(
      (cols) =>
        `CREATE INDEX \`${prefix}_${cols.join("_")}\` ON \`${name}\` (${cols.map((col) => `\`${col}\``).join(", ")})`,
    ),
    `CREATE UNIQUE INDEX \`${prefix}_source_key\` ON \`${name}\` (\`source_key\`)`,
  ];
}

async function collectionDefinitions(pb: PocketBase, round: Round) {
  const stateTemplate = await pb.collections.getOne(ROUND_ONE_STATE_COLLECTION);
  const aiTemplate = await pb.collections.getOne(ALL_INDIA_TEMPLATE_COLLECTION);
  if (stateTemplate.listRule !== SERVICE_RULE || aiTemplate.listRule !== SERVICE_RULE) {
    throw new Error("Template collections no longer use the app_services rule; refusing to clone");
  }
  const stateName = `2026_mht_cet_round_${ROUND_WORDS[round]}_cutoffs`;
  const aiName = `2026_all_india_rounds_${ROUND_WORDS[round]}`;
  const stateFields = [textField("source_key", true), ...cloneFields(stateTemplate, new Set())];
  const aiFields = [
    textField("source_key", true),
    ...cloneFields(aiTemplate, new Set(["sr_no"])),
    numberField("total_admitted", true),
    textField("admitted_by_exam"),
    textField("source_pdf"),
    numberField("source_page", true),
    numberField("source_serial_no", true),
    textField("source_pdf_sha256"),
    textField("source_index_url"),
  ];
  return {
    state: {
      name: stateName,
      type: "base",
      listRule: SERVICE_RULE,
      viewRule: SERVICE_RULE,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: stateFields,
      indexes: indexStatements(stateName, [
        ["college_code"],
        ["cutoff_score"],
        ["last_rank"],
        ["category", "cutoff_score"],
        ["course_name"],
        ["status"],
        ["home_university"],
        ["institute_home_university_id", "seat_allocation_section"],
      ]),
    },
    allIndia: {
      name: aiName,
      type: "base",
      listRule: SERVICE_RULE,
      viewRule: SERVICE_RULE,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: aiFields,
      indexes: indexStatements(aiName, [["rank"], ["percentile"], ["college_code"], ["course_name"]]),
    },
  };
}

async function collectionExists(pb: PocketBase, name: string): Promise<boolean> {
  try {
    await pb.collections.getOne(name);
    return true;
  } catch (error) {
    if ((error as { status?: number }).status === 404) return false;
    throw error;
  }
}

async function upsertAll<T extends { source_key: string }>(
  pb: PocketBase,
  collection: string,
  records: T[],
  admittedField: keyof T,
) {
  const ids = new Set(records.map((record) => recordIdFor(record.source_key)));
  if (ids.size !== records.length) throw new Error(`Record id collision in ${collection}`);
  const existing = await pb.collection(collection).getFullList({ batch: 1000, fields: "id" });
  const foreign = existing.filter((row) => !ids.has(row.id));
  if (foreign.length > 0) {
    throw new Error(
      `${collection} holds ${foreign.length} rows outside this verified import; refusing to touch it`,
    );
  }
  // Production keeps the batch API disabled, so write record by record with a
  // small worker pool (the host is a 1 GiB droplet).
  const existingIds = new Set(existing.map((row) => row.id));
  let next = 0;
  let written = 0;
  const worker = async () => {
    while (next < records.length) {
      const record = records[next++];
      const id = recordIdFor(record.source_key);
      const body = {
        ...record,
        [SOURCE_ID_FIELD]: record.source_key,
        [SOURCE_CREATED_FIELD]: IMPORTED_AT,
        [SOURCE_UPDATED_FIELD]: IMPORTED_AT,
      };
      if (existingIds.has(id)) {
        await pb.collection(collection).update(id, body);
      } else {
        await pb.collection(collection).create({ id, ...body });
      }
      written += 1;
      if (written % 5000 === 0) console.log(`  ${collection}: ${written}/${records.length}`);
    }
  };
  await Promise.all(Array.from({ length: WRITE_CONCURRENCY }, worker));
  const stored = await pb.collection(collection).getFullList({
    batch: 1000,
    fields: `id,${String(admittedField)}`,
  });
  const storedAdmitted = stored.reduce((sum, row) => sum + Number(row[String(admittedField)]), 0);
  const expectedAdmitted = records.reduce((sum, row) => sum + Number(row[admittedField]), 0);
  if (stored.length !== records.length || storedAdmitted !== expectedAdmitted) {
    throw new Error(
      `${collection} read-back failed: rows ${stored.length}/${records.length}, admitted ${storedAdmitted}/${expectedAdmitted}`,
    );
  }
  console.log(`  ${collection}: verified ${stored.length} rows, ${storedAdmitted} admitted`);
}

async function connect(): Promise<PocketBase> {
  dotenv.config({ path: resolve(repositoryRoot, ".env"), quiet: true });
  const url = process.env.POCKETBASE_IMPORT_URL || "http://127.0.0.1:8090";
  const email = process.env.POCKETBASE_SUPERUSER_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
  const password =
    process.env.POCKETBASE_SUPERUSER_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set POCKETBASE_SUPERUSER_EMAIL and POCKETBASE_SUPERUSER_PASSWORD");
  }
  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  await pb.collection("_superusers").authWithPassword(email, password);
  console.log(`Authenticated as a PocketBase superuser at ${url}`);
  return pb;
}

async function main() {
  const { round, archive: archivePath, apply } = parseCli();
  const archive = loadArchive(archivePath, round);
  const pb = await connect();
  const reference = await loadRoundOneReference(pb);
  const state = buildStateRecords(round, archive, reference.eligibility, reference.collegeNames);
  const allIndia = buildAllIndiaRecords(round, archive, reference.collegeNames);
  const definitions = await collectionDefinitions(pb, round);

  const summary = {
    round: ROUND_NUMERALS[round],
    archive_pdfs: archive.pdfSha256.size,
    not_found_on_server: archive.verification.not_found_on_server,
    ...state.summary,
    all_india_rows: allIndia.length,
    all_india_admitted_seats: allIndia.reduce((sum, row) => sum + row.total_admitted, 0),
    state_collection: round === 1 ? `${ROUND_ONE_STATE_COLLECTION} (live; not written)` : definitions.state.name,
    state_collection_exists: await collectionExists(pb, definitions.state.name),
    all_india_collection: definitions.allIndia.name,
    all_india_collection_exists: await collectionExists(pb, definitions.allIndia.name),
    round_one_regression:
      round === 1 ? compareWithRoundOne(state.records, reference.rows) : undefined,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!apply) {
    console.log("Dry run complete. Pass --apply to write to PocketBase.");
    return;
  }
  const targets = round === 1 ? [definitions.allIndia] : [definitions.state, definitions.allIndia];
  for (const definition of targets) {
    await ensureCollection(pb, definition);
  }
  if (round !== 1) {
    await upsertAll(pb, definitions.state.name, state.records, "total_admitted");
  }
  await upsertAll(pb, definitions.allIndia.name, allIndia, "total_admitted");
  console.log("Import complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
