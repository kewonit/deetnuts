import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type InstituteReference = {
  year: number;
  institute_code: string;
  institute_name: string;
  home_university_id: string;
  affiliating_university_id: string;
  minority_community_id: string | null;
};

const repositoryRoot = resolve(__dirname, "..");
const ejamRoot = resolve(repositoryRoot, "..", "ejam");
const outputPath = resolve(
  repositoryRoot,
  "lib/mht-cet/state-cutoffs/institute-eligibility.generated.json",
);
const migrationPath = resolve(
  repositoryRoot,
  "supabase/migrations/20260728201703_add_mht_cet_candidate_eligibility.sql",
);
const years = [2024, 2025] as const;
const cutoffTables = [
  [2024, "2024_mht_cet_round_one_cutoffs_duplicate", "24r1"],
  [2024, "2024_mht_cet_round_two_cutoffs", "24r2"],
  [2024, "2024_mht_cet_round_three_cutoffs", "24r3"],
  [2025, "2025_mht_cet_round_one_cutoffs", "25r1"],
  [2025, "2025_mht_cet_round_two_cutoffs", "25r2"],
  [2025, "2025_mht_cet_round_three_cutoffs", "25r3"],
  [2025, "2025_mht_cet_round_four_cutoffs", "25r4"],
] as const;

const references = years.flatMap((year) => {
  const sourcePath = resolve(
    ejamRoot,
    `data/reference/engineering/mht-cet/institutes-${year}.json`,
  );
  return JSON.parse(readFileSync(sourcePath, "utf8")) as InstituteReference[];
});

const normalized = references
  .map((institute) => ({
    year: institute.year,
    institute_code: institute.institute_code.padStart(5, "0"),
    institute_name: institute.institute_name,
    institute_home_university_id: institute.home_university_id,
    affiliating_university_id: institute.affiliating_university_id,
    minority_community_id: institute.minority_community_id,
  }))
  .sort(
    (left, right) =>
      left.year - right.year ||
      left.institute_code.localeCompare(right.institute_code),
  );

const duplicateKeys = normalized
  .map((institute) => `${institute.year}:${institute.institute_code}`)
  .filter((key, index, keys) => keys.indexOf(key) !== index);

if (duplicateKeys.length > 0) {
  throw new Error(`Duplicate institute eligibility keys: ${duplicateKeys}`);
}

for (const [year, table] of cutoffTables) {
  const snapshotPath = resolve(
    ejamRoot,
    `data/_scratch/mht-cet/snapshots/deetnuts-2024-2025/${table}.json`,
  );
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
    category: string;
    college_code: string | number;
  }>;
  const knownCodes = new Set(
    normalized
      .filter((institute) => institute.year === year)
      .map((institute) => institute.institute_code),
  );
  const missingCodes = [
    ...new Set(
      snapshot
        .filter((row) => row.category !== "AI")
        .map((row) => String(row.college_code).padStart(5, "0"))
        .filter((code) => !knownCodes.has(code)),
    ),
  ];

  if (missingCodes.length > 0) {
    throw new Error(
      `${table} contains unmapped institute codes: ${missingCodes.join(", ")}`,
    );
  }
}

const sourceFiles = years.map(
  (year) => `data/reference/engineering/mht-cet/institutes-${year}.json`,
);
const sourceSha256 = createHash("sha256")
  .update(
    sourceFiles
      .map((path) => readFileSync(resolve(ejamRoot, path)))
      .reduce((combined, contents) => Buffer.concat([combined, contents])),
  )
  .digest("hex");

const generated = {
  schema_version: 1,
  generated_from: "github/ejam",
  source_files: sourceFiles,
  source_sha256: sourceSha256,
  institutes: normalized,
};

writeFileSync(outputPath, `${JSON.stringify(generated, null, 2)}\n`);

const seedJson = JSON.stringify(normalized).replace(/\$mht\$/g, "");
const tableValues = cutoffTables
  .map(([year, table, key]) => `(${year}, '${table}', '${key}')`)
  .join(",\n      ");

const migration = `-- Generated from github/ejam institute references by
-- scripts/generate-mht-cet-eligibility-map.ts.
-- Source SHA-256: ${sourceSha256}

begin;

set local lock_timeout = '5s';
set local statement_timeout = '15min';

do $preflight$
declare
  required_table text;
begin
  for required_table in
    select table_name
    from (
      values
      ${tableValues}
    ) as configured(year, table_name, index_key)
  loop
    if to_regclass(format('public.%I', required_table)) is null then
      raise exception 'Required cutoff table % is missing', required_table;
    end if;
  end loop;
end
$preflight$;

create table if not exists public.mht_cet_institute_eligibility (
  year integer not null,
  institute_code text not null,
  institute_name text not null,
  institute_home_university_id text not null,
  affiliating_university_id text not null,
  minority_community_id text,
  primary key (year, institute_code),
  constraint mht_cet_eligibility_year_check check (year in (2024, 2025)),
  constraint mht_cet_eligibility_code_check check (
    institute_code ~ '^[0-9]{5}$'
  )
);

alter table public.mht_cet_institute_eligibility enable row level security;
revoke all on public.mht_cet_institute_eligibility from anon, authenticated;
grant select on public.mht_cet_institute_eligibility to service_role;

insert into public.mht_cet_institute_eligibility (
  year,
  institute_code,
  institute_name,
  institute_home_university_id,
  affiliating_university_id,
  minority_community_id
)
select
  seed.year,
  seed.institute_code,
  seed.institute_name,
  seed.institute_home_university_id,
  seed.affiliating_university_id,
  seed.minority_community_id
from jsonb_to_recordset($mht$${seedJson}$mht$::jsonb) as seed(
  year integer,
  institute_code text,
  institute_name text,
  institute_home_university_id text,
  affiliating_university_id text,
  minority_community_id text
)
on conflict (year, institute_code) do update set
  institute_name = excluded.institute_name,
  institute_home_university_id = excluded.institute_home_university_id,
  affiliating_university_id = excluded.affiliating_university_id,
  minority_community_id = excluded.minority_community_id;

do $seed_verification$
declare
  total_count bigint;
  count_2024 bigint;
  count_2025 bigint;
begin
  select
    count(*),
    count(*) filter (where year = 2024),
    count(*) filter (where year = 2025)
  into total_count, count_2024, count_2025
  from public.mht_cet_institute_eligibility;

  if total_count <> ${normalized.length}
    or count_2024 <> ${normalized.filter(({ year }) => year === 2024).length}
    or count_2025 <> ${normalized.filter(({ year }) => year === 2025).length}
  then
    raise exception
      'Institute eligibility seed verification failed (total %, 2024 %, 2025 %)',
      total_count,
      count_2024,
      count_2025;
  end if;
end
$seed_verification$;

do $migration$
declare
  cutoff_year integer;
  cutoff_table text;
  index_key text;
  missing_count bigint;
begin
  for cutoff_year, cutoff_table, index_key in
    select *
    from (
      values
      ${tableValues}
    ) as configured(year, table_name, index_key)
  loop
    execute format(
      'alter table public.%I
       add column if not exists institute_home_university_id text,
       add column if not exists affiliating_university_id text,
       add column if not exists minority_community_id text',
      cutoff_table
    );

    execute format(
      'update public.%I as cutoffs
       set institute_home_university_id = institutes.institute_home_university_id,
           affiliating_university_id = institutes.affiliating_university_id,
           minority_community_id = institutes.minority_community_id
       from public.mht_cet_institute_eligibility as institutes
       where institutes.year = $1
         and institutes.institute_code = lpad(cutoffs.college_code::text, 5, ''0'')
         and (
           cutoffs.institute_home_university_id is distinct from institutes.institute_home_university_id
           or cutoffs.affiliating_university_id is distinct from institutes.affiliating_university_id
           or cutoffs.minority_community_id is distinct from institutes.minority_community_id
         )',
      cutoff_table
    ) using cutoff_year;

    execute format(
      'select count(*)
       from public.%I
       where coalesce(category, '''') <> ''AI''
         and (
           institute_home_university_id is null
           or affiliating_university_id is null
         )',
      cutoff_table
    ) into missing_count;

    if missing_count > 0 then
      raise exception '% contains % non-All-India rows without normalized institute eligibility', cutoff_table, missing_count;
    end if;

    execute format(
      'create index if not exists %I on public.%I (institute_home_university_id)',
      'mht_' || index_key || '_home_university_idx',
      cutoff_table
    );
    execute format(
      'create index if not exists %I on public.%I
       (category, institute_home_university_id, seat_allocation_section, cutoff_score desc, id)',
      'mht_' || index_key || '_profile_percentile_idx',
      cutoff_table
    );
    execute format(
      'create index if not exists %I on public.%I
       (category, institute_home_university_id, seat_allocation_section, last_rank, id)
       where last_rank is not null and last_rank > 0',
      'mht_' || index_key || '_profile_rank_idx',
      cutoff_table
    );
    execute format(
      'create index if not exists %I on public.%I (category, minority_community_id)',
      'mht_' || index_key || '_minority_idx',
      cutoff_table
    );
    execute format('analyze public.%I', cutoff_table);
  end loop;
end
$migration$;

commit;
`;

writeFileSync(migrationPath, migration);

console.log(
  `Generated ${normalized.length} institute eligibility records (${sourceSha256}).`,
);
