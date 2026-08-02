import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";

type CsvRow = Record<string, string>;

type EligibilityRecord = {
  year: number;
  institute_code: string;
  institute_name: string;
  institute_home_university_id: string;
  affiliating_university_id: string;
  minority_community_id: string | null;
};

type DatabaseRecord = {
  id: string;
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

const SOURCE_INDEX_URL =
  "https://fe2026.mahacet.org/StaticPages/frmInstituteWiseAllotmentList?did=2021";
const TABLE_NAME = "2026_mht_cet_round_one_cutoffs";
const repositoryRoot = resolve(__dirname, "..");
const archiveRoot = resolve(
  repositoryRoot,
  "data/output/mahacet_2026_cap_round_1",
);
const cleanedRoot = resolve(archiveRoot, "cleaned");
const manifestRoot = resolve(archiveRoot, "manifests");
const databaseOutputRoot = resolve(archiveRoot, "database");

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

const readCsv = (path: string): CsvRow[] =>
  parse(readFileSync(path), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: false,
  }) as CsvRow[];

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
    throw new Error(`Invalid cutoff score: ${JSON.stringify(value)}`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`Cutoff score is outside 0..100: ${value}`);
  }
  return parsed;
};

const minorityIdFromStatus = (status: string): string | null => {
  const marker = "Minority - ";
  const markerIndex = status.indexOf(marker);
  if (markerIndex < 0) return null;

  const community = status.slice(markerIndex + marker.length);
  const id = MINORITY_IDS[community];
  if (!id) {
    throw new Error(`Unmapped minority status: ${status}`);
  }
  return id;
};

const normalizeCategory = (category: string): string => {
  if (category === "ORPHANI" || category === "ORPHANN") return "ORPHAN";
  if (!/^[A-Z0-9]+$/.test(category)) {
    throw new Error(`Invalid seat category: ${JSON.stringify(category)}`);
  }
  return category;
};

const normalizeAllocationSection = (row: CsvRow, category: string): string => {
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
  if (
    ![
      "HOME_TO_HOME",
      "HOME_TO_OTHER",
      "OTHER_TO_HOME",
      "OTHER_TO_OTHER",
      "STATE_LEVEL",
    ].includes(row.allocation_section)
  ) {
    throw new Error(
      `Unsupported state allocation section: ${row.allocation_section}`,
    );
  }
  return row.allocation_section;
};

const sqlLiteral = (value: unknown): string =>
  JSON.stringify(value).replace(/\$mht2026\$/g, "");

const copyCsvCell = (value: string | number | null): string => {
  if (value === null) return "";
  if (typeof value === "number") return String(value);
  return `"${value.replace(/"/g, '""')}"`;
};

function main() {
  const shouldWriteSql = process.argv.includes("--write-sql");
  const unknownArguments = process.argv
    .slice(2)
    .filter((argument) => argument !== "--write-sql");
  if (unknownArguments.length > 0) {
    throw new Error(`Unknown arguments: ${unknownArguments.join(", ")}`);
  }

  const verification = JSON.parse(
    readFileSync(resolve(manifestRoot, "verification.json"), "utf8"),
  ) as Record<string, unknown>;
  if (
    verification.source_url !== SOURCE_INDEX_URL ||
    verification.source_pdf_link_count !== 380 ||
    verification.verified !== true ||
    verification.complete_source_run !== true ||
    verification.download_failures !== 0 ||
    verification.all_courses_have_cap_counts !== true ||
    verification.row_count_matches_cap_seats !== true ||
    verification.extraction_issue_count !== 0 ||
    verification.processed_institute_count !== 380
  ) {
    throw new Error(
      "The local archive has not passed complete strict verification; refusing to prepare an import",
    );
  }

  const downloads = JSON.parse(
    readFileSync(resolve(manifestRoot, "downloads.json"), "utf8"),
  ) as Array<{ pdf_filename: string; sha256: string; status: string }>;
  if (!Array.isArray(downloads) || downloads.length !== 380) {
    throw new Error(
      `Expected exactly 380 download records, found ${Array.isArray(downloads) ? downloads.length : "a non-array manifest"}`,
    );
  }
  const pdfSha256 = new Map(
    downloads.map((download) => {
      if (
        !["downloaded", "reused"].includes(download.status) ||
        !/^CAPR-I_\d{5}\.pdf$/.test(download.pdf_filename) ||
        !/^[0-9a-f]{64}$/.test(download.sha256)
      ) {
        throw new Error(`Unverified download record: ${download.pdf_filename}`);
      }
      return [download.pdf_filename, download.sha256];
    }),
  );
  if (pdfSha256.size !== 380) {
    throw new Error(`Expected 380 unique PDF hashes, found ${pdfSha256.size}`);
  }

  const courses = readCsv(resolve(cleanedRoot, "courses.csv"));
  const courseByKey = new Map<string, CsvRow>();
  const explicitHomeUniversityIdsByInstitute = new Map<string, Set<string>>();
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
    const key = [
      course.institute_code,
      course.choice_code,
      course.course_variant,
    ].join(":");
    if (courseByKey.has(key)) {
      throw new Error(`Duplicate course metadata key: ${key}`);
    }
    courseByKey.set(key, course);
    const explicitHomeUniversityId =
      HOME_UNIVERSITY_IDS[course.home_university];
    if (explicitHomeUniversityId) {
      const instituteIds =
        explicitHomeUniversityIdsByInstitute.get(course.institute_code) ??
        new Set<string>();
      instituteIds.add(explicitHomeUniversityId);
      explicitHomeUniversityIdsByInstitute.set(
        course.institute_code,
        instituteIds,
      );
    }
  }
  for (const [instituteCode, ids] of explicitHomeUniversityIdsByInstitute) {
    if (ids.size !== 1) {
      throw new Error(
        `Institute ${instituteCode} has conflicting explicit home universities: ${[
          ...ids,
        ].join(", ")}`,
      );
    }
  }

  const generatedEligibility = JSON.parse(
    readFileSync(
      resolve(
        repositoryRoot,
        "lib/mht-cet/state-cutoffs/institute-eligibility.generated.json",
      ),
      "utf8",
    ),
  ) as { institutes: EligibilityRecord[] };
  const eligibility2025 = new Map(
    generatedEligibility.institutes
      .filter((record) => record.year === 2025)
      .map((record) => [record.institute_code, record]),
  );

  const sourceCutoffs = readCsv(resolve(cleanedRoot, "derived_cutoffs.csv"));
  const databaseGroups = new Map<string, DatabaseRecord>();
  let excludedVacantGroups = 0;
  let excludedAllIndiaGroups = 0;
  let includedSourceGroups = 0;
  let includedAdmittedSeats = 0;
  const newInstituteCodes = new Set<string>();

  for (const row of sourceCutoffs) {
    if (row.total_admitted === "0") {
      excludedVacantGroups += 1;
      continue;
    }
    if (row.exam !== "MHT_CET" || row.allocation_section === "ALL_INDIA") {
      excludedAllIndiaGroups += 1;
      continue;
    }

    const totalAdmitted = parsePositiveInteger(
      row.total_admitted,
      "total_admitted",
    );
    const lastRank = parsePositiveInteger(row.last_rank, "last_rank");
    const cutoffScore = parseScore(row.cutoff_score);
    const courseKey = [
      row.institute_code,
      row.choice_code,
      row.course_variant,
    ].join(":");
    const course = courseByKey.get(courseKey);
    if (!course) {
      throw new Error(
        `Cutoff has no exact course metadata match: ${courseKey}`,
      );
    }
    if (
      course.institute_name !== row.institute_name ||
      course.course_name !== row.course_name
    ) {
      throw new Error(`Cutoff/course metadata mismatch: ${courseKey}`);
    }

    const existingEligibility = eligibility2025.get(row.institute_code);
    let instituteHomeUniversityId: string;
    let affiliatingUniversityId: string | null;
    if (existingEligibility) {
      instituteHomeUniversityId =
        existingEligibility.institute_home_university_id;
      affiliatingUniversityId = existingEligibility.affiliating_university_id;
      const explicitHomeUniversityId = [
        ...(explicitHomeUniversityIdsByInstitute.get(row.institute_code) ?? []),
      ][0];
      if (
        explicitHomeUniversityId &&
        explicitHomeUniversityId !== instituteHomeUniversityId
      ) {
        throw new Error(
          `2026 home-university source conflicts with 2025 eligibility for ${row.institute_code}`,
        );
      }
    } else {
      newInstituteCodes.add(row.institute_code);
      instituteHomeUniversityId = [
        ...(explicitHomeUniversityIdsByInstitute.get(row.institute_code) ?? []),
      ][0];
      if (!instituteHomeUniversityId) {
        throw new Error(
          `New institute ${row.institute_code} has no exact home-university mapping for ${course.home_university}`,
        );
      }
      affiliatingUniversityId = null;
    }

    const minorityCommunityId = minorityIdFromStatus(course.institute_status);
    if (
      existingEligibility &&
      minorityCommunityId !== existingEligibility.minority_community_id
    ) {
      throw new Error(
        `2026 minority status conflicts with 2025 eligibility for ${row.institute_code}`,
      );
    }

    const category = normalizeCategory(row.seat_type);
    const seatAllocationSection = normalizeAllocationSection(row, category);
    if (category === "MI" && !minorityCommunityId) {
      throw new Error(
        `MI cutoff belongs to non-minority institute ${row.institute_code}`,
      );
    }
    if (row.allocation_section === "EWS" && category !== "EWS") {
      throw new Error(`EWS section contains non-EWS category ${category}`);
    }

    const sourcePdfSha256 = pdfSha256.get(row.cutoff_source_pdf);
    if (!sourcePdfSha256) {
      throw new Error(
        `Cutoff references an unknown PDF: ${row.cutoff_source_pdf}`,
      );
    }
    if (row.cutoff_source_pdf !== `CAPR-I_${row.institute_code}.pdf`) {
      throw new Error(`Cutoff PDF/institute mismatch for ${courseKey}`);
    }

    const normalizedKey = [
      row.institute_code,
      row.choice_code,
      category,
      seatAllocationSection,
    ].join("|");
    const candidate: DatabaseRecord = {
      id: `26r1_${createHash("sha256").update(normalizedKey).digest("hex").slice(0, 24)}`,
      college_code: row.institute_code.replace(/^0+(?=\d)/, ""),
      college_name: row.institute_name,
      course_code: row.choice_code,
      course_name: row.course_name,
      category,
      seat_allocation_section: seatAllocationSection,
      cutoff_score: cutoffScore,
      last_rank: lastRank,
      total_admitted: totalAdmitted,
      status: course.institute_status,
      home_university: course.home_university,
      institute_home_university_id: instituteHomeUniversityId,
      affiliating_university_id: affiliatingUniversityId,
      minority_community_id: minorityCommunityId,
      source_pdf: row.cutoff_source_pdf,
      source_page: parsePositiveInteger(
        row.cutoff_source_page,
        "cutoff_source_page",
      ),
      source_serial_no: parsePositiveInteger(
        row.cutoff_source_serial_no,
        "cutoff_source_serial_no",
      ),
      source_pdf_sha256: sourcePdfSha256,
      source_index_url: SOURCE_INDEX_URL,
    };

    const existing = databaseGroups.get(normalizedKey);
    if (!existing) {
      databaseGroups.set(normalizedKey, candidate);
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

    includedSourceGroups += 1;
    includedAdmittedSeats += totalAdmitted;
  }

  const records = [...databaseGroups.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  if (
    records.length === 0 ||
    new Set(records.map(({ id }) => id)).size !== records.length
  ) {
    throw new Error(
      "The normalized database records are empty or have duplicate IDs",
    );
  }
  const normalizedAdmittedSeats = records.reduce(
    (sum, record) => sum + record.total_admitted,
    0,
  );
  if (normalizedAdmittedSeats !== includedAdmittedSeats) {
    throw new Error("Seat totals changed during normalization");
  }

  const summary = {
    source_cutoff_groups: sourceCutoffs.length,
    included_source_groups: includedSourceGroups,
    excluded_vacant_groups: excludedVacantGroups,
    excluded_all_india_or_non_mht_groups: excludedAllIndiaGroups,
    normalized_database_rows: records.length,
    normalized_admitted_seats: normalizedAdmittedSeats,
    new_institute_codes: [...newInstituteCodes].sort(),
    new_institute_affiliating_ids_left_null: newInstituteCodes.size,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!shouldWriteSql) {
    console.log(
      "Dry run complete. Pass --write-sql to create the local import SQL.",
    );
    return;
  }

  mkdirSync(databaseOutputRoot, { recursive: true });
  writeFileSync(
    resolve(databaseOutputRoot, "normalized_cutoffs.json"),
    `${JSON.stringify({ summary, records }, null, 2)}\n`,
  );

  const columns = Object.keys(records[0]) as Array<keyof DatabaseRecord>;
  writeFileSync(
    resolve(databaseOutputRoot, "copy.csv"),
    `${columns.join(",")}\n${records
      .map((record) =>
        columns.map((column) => copyCsvCell(record[column])).join(","),
      )
      .join("\n")}\n`,
  );
  const typedColumns = columns
    .map((column) => {
      if (
        [
          "cutoff_score",
          "last_rank",
          "total_admitted",
          "source_page",
          "source_serial_no",
        ].includes(column)
      ) {
        const type =
          column === "cutoff_score"
            ? "numeric"
            : column === "last_rank"
              ? "bigint"
              : "integer";
        return `  ${column} ${type}`;
      }
      return `  ${column} text`;
    })
    .join(",\n");
  const assignments = columns
    .filter((column) => column !== "id")
    .map((column) => `  ${column} = excluded.${column}`)
    .concat("  updated = now()")
    .join(",\n");
  const sql = `begin;

set local lock_timeout = '5s';
set local statement_timeout = '15min';

create temporary table import_2026_mht_cet_round_one
  (like public."${TABLE_NAME}" including defaults)
  on commit drop;

insert into import_2026_mht_cet_round_one (${columns.join(", ")})
select ${columns.join(", ")}
from jsonb_to_recordset($mht2026$${sqlLiteral(records)}$mht2026$::jsonb) as source(
${typedColumns}
);

do $preflight$
begin
  if exists (
    select 1
    from public."${TABLE_NAME}" as target
    where not exists (
      select 1
      from import_2026_mht_cet_round_one as source
      where source.id = target.id
    )
  ) then
    raise exception 'The target contains rows outside this verified import; refusing to overwrite or delete them';
  end if;
end
$preflight$;

insert into public."${TABLE_NAME}" (${columns.join(", ")})
select ${columns.join(", ")}
from import_2026_mht_cet_round_one
on conflict (id) do update set
${assignments};

do $verification$
declare
  stored_rows bigint;
  stored_admitted bigint;
begin
  select count(*), sum(total_admitted)
  into stored_rows, stored_admitted
  from public."${TABLE_NAME}";

  if stored_rows <> ${records.length} or stored_admitted <> ${normalizedAdmittedSeats} then
    raise exception
      '2026 CAP-I import verification failed (rows %, admitted %)',
      stored_rows,
      stored_admitted;
  end if;
end
$verification$;

commit;
`;
  writeFileSync(resolve(databaseOutputRoot, "import.sql"), sql);
  console.log(`Wrote ${resolve(databaseOutputRoot, "import.sql")}`);
}

main();
