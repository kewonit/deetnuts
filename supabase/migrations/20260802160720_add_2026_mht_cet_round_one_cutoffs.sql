begin;

set local lock_timeout = '5s';
set local statement_timeout = '15min';

create table if not exists public."2026_mht_cet_round_one_cutoffs" (
  id text primary key,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone not null default now(),
  college_code text not null,
  college_name text not null,
  course_code text not null,
  course_name text not null,
  category text not null,
  seat_allocation_section text not null,
  cutoff_score numeric not null,
  last_rank bigint not null,
  total_admitted integer not null,
  status text not null,
  home_university text not null,
  institute_home_university_id text not null,
  affiliating_university_id text,
  minority_community_id text,
  source_pdf text not null,
  source_page integer not null,
  source_serial_no integer not null,
  source_pdf_sha256 text not null,
  source_index_url text not null,
  constraint mht_cet_2026_r1_college_code_check check (
    college_code ~ '^[0-9]{1,5}$'
  ),
  constraint mht_cet_2026_r1_course_code_check check (
    course_code ~ '^[0-9]{10}[A-Z]{0,3}$'
  ),
  constraint mht_cet_2026_r1_category_check check (
    category ~ '^[A-Z0-9]+$'
  ),
  constraint mht_cet_2026_r1_allocation_section_check check (
    seat_allocation_section in (
      'HOME_TO_HOME',
      'HOME_TO_OTHER',
      'OTHER_TO_HOME',
      'OTHER_TO_OTHER',
      'STATE_LEVEL'
    )
  ),
  constraint mht_cet_2026_r1_cutoff_score_check check (
    cutoff_score >= 0 and cutoff_score <= 100
  ),
  constraint mht_cet_2026_r1_last_rank_check check (last_rank > 0),
  constraint mht_cet_2026_r1_total_admitted_check check (total_admitted > 0),
  constraint mht_cet_2026_r1_source_pdf_check check (
    source_pdf ~ '^CAPR-I_[0-9]{5}\.pdf$'
  ),
  constraint mht_cet_2026_r1_source_page_check check (source_page > 0),
  constraint mht_cet_2026_r1_source_serial_check check (source_serial_no > 0),
  constraint mht_cet_2026_r1_source_sha256_check check (
    source_pdf_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint mht_cet_2026_r1_source_index_url_check check (
    source_index_url =
      'https://fe2026.mahacet.org/StaticPages/frmInstituteWiseAllotmentList?did=2021'
  )
);

do $schema_check$
begin
  if not exists (
    select 1
    from pg_constraint as constraints
    where constraints.conrelid =
      'public."2026_mht_cet_round_one_cutoffs"'::regclass
      and constraints.conname = 'mht_cet_2026_r1_source_index_url_check'
  ) then
    alter table public."2026_mht_cet_round_one_cutoffs"
      add constraint mht_cet_2026_r1_source_index_url_check check (
        source_index_url =
          'https://fe2026.mahacet.org/StaticPages/frmInstituteWiseAllotmentList?did=2021'
      );
  end if;

  if exists (
    select expected.column_name, expected.data_type, expected.is_nullable
    from (
      values
        ('id', 'text', 'NO'),
        ('created', 'timestamp with time zone', 'NO'),
        ('updated', 'timestamp with time zone', 'NO'),
        ('college_code', 'text', 'NO'),
        ('college_name', 'text', 'NO'),
        ('course_code', 'text', 'NO'),
        ('course_name', 'text', 'NO'),
        ('category', 'text', 'NO'),
        ('seat_allocation_section', 'text', 'NO'),
        ('cutoff_score', 'numeric', 'NO'),
        ('last_rank', 'bigint', 'NO'),
        ('total_admitted', 'integer', 'NO'),
        ('status', 'text', 'NO'),
        ('home_university', 'text', 'NO'),
        ('institute_home_university_id', 'text', 'NO'),
        ('affiliating_university_id', 'text', 'YES'),
        ('minority_community_id', 'text', 'YES'),
        ('source_pdf', 'text', 'NO'),
        ('source_page', 'integer', 'NO'),
        ('source_serial_no', 'integer', 'NO'),
        ('source_pdf_sha256', 'text', 'NO'),
        ('source_index_url', 'text', 'NO')
    ) as expected(column_name, data_type, is_nullable)
    except
    select
      columns.column_name::text,
      columns.data_type::text,
      columns.is_nullable::text
    from information_schema.columns
    where columns.table_schema = 'public'
      and columns.table_name = '2026_mht_cet_round_one_cutoffs'
  ) then
    raise exception
      'Existing 2026 CAP Round I cutoff table does not match the required schema';
  end if;

  if exists (
    select expected.constraint_name
    from (
      values
        ('2026_mht_cet_round_one_cutoffs_pkey'),
        ('mht_cet_2026_r1_college_code_check'),
        ('mht_cet_2026_r1_course_code_check'),
        ('mht_cet_2026_r1_category_check'),
        ('mht_cet_2026_r1_allocation_section_check'),
        ('mht_cet_2026_r1_cutoff_score_check'),
        ('mht_cet_2026_r1_last_rank_check'),
        ('mht_cet_2026_r1_total_admitted_check'),
        ('mht_cet_2026_r1_source_pdf_check'),
        ('mht_cet_2026_r1_source_page_check'),
        ('mht_cet_2026_r1_source_serial_check'),
        ('mht_cet_2026_r1_source_sha256_check'),
        ('mht_cet_2026_r1_source_index_url_check')
    ) as expected(constraint_name)
    except
    select constraints.conname::text
    from pg_constraint as constraints
    where constraints.conrelid =
      'public."2026_mht_cet_round_one_cutoffs"'::regclass
  ) then
    raise exception
      'Existing 2026 CAP Round I cutoff table is missing required constraints';
  end if;
end
$schema_check$;

comment on table public."2026_mht_cet_round_one_cutoffs" is
  'Verified MHT-CET 2026 CAP Round I state/MHT-CET filled cutoff groups, derived from the official institute-wise allotment PDFs.';

alter table public."2026_mht_cet_round_one_cutoffs" enable row level security;

revoke all privileges on table public."2026_mht_cet_round_one_cutoffs"
  from public, anon, authenticated, service_role;
grant select on table public."2026_mht_cet_round_one_cutoffs" to service_role;

create index if not exists mht_cet_2026_r1_college_code_idx
  on public."2026_mht_cet_round_one_cutoffs" (college_code);
create index if not exists mht_cet_2026_r1_home_university_idx
  on public."2026_mht_cet_round_one_cutoffs" (home_university);
create index if not exists mht_cet_2026_r1_minority_idx
  on public."2026_mht_cet_round_one_cutoffs" (
    category,
    minority_community_id
  );
create index if not exists mht_cet_2026_r1_profile_percentile_idx
  on public."2026_mht_cet_round_one_cutoffs" (
    category,
    institute_home_university_id,
    seat_allocation_section,
    cutoff_score desc,
    id
  );
create index if not exists mht_cet_2026_r1_profile_rank_idx
  on public."2026_mht_cet_round_one_cutoffs" (
    category,
    institute_home_university_id,
    seat_allocation_section,
    last_rank,
    id
  );

commit;
