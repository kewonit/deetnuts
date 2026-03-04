-- PocketBase -> Supabase structural migration
-- Generated: 2026-03-04

create extension if not exists pg_trgm;

-- JoSAA
create table if not exists public.josaa_institutes (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  name text not null,
  code text,
  short_name text,
  slug text,
  institute_type text,
  state text,
  city text,
  established_year int,
  nirf_rank int,
  website text,
  logo_url text,
  years_active int[] default '{}',
  original_id text unique
);

create table if not exists public.josaa_branches (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  name text not null,
  code text,
  short_code text,
  degree_type text,
  duration int,
  duration_years int,
  specializations text[] default '{}',
  years_active int[] default '{}',
  original_id text unique
);

create table if not exists public.josaa_cutoffs (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  institute text,
  institute_id text not null,
  branch text,
  branch_id text not null,
  branch_code text,
  year int not null,
  round int not null,
  category text not null,
  gender text not null,
  seat_type text,
  opening_rank int,
  closing_rank int,
  quota text,
  is_pwd boolean,
  source text
);

create table if not exists public.josaa_institute_aliases (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  institute text,
  alias text not null,
  is_official boolean default false
);

-- MHT-CET
create table if not exists public."2024_mht_cet_colleges" (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  college_id int,
  college_name text,
  status text,
  home_university text
);

create table if not exists public."2024_mht_cet_colleges_seat_matrix" (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  page_number text,
  college_code text,
  college_name text,
  choice_code text,
  course_name text,
  seat_type text,
  "SI" int,
  "MS_seats" int,
  minority_seats int,
  all_india int,
  institute_seats int,
  orphan int,
  "CAP_seats" int,
  "OPEN_General" int,
  "OPEN_Ladies" int,
  "SC_General" int,
  "SC_Ladies" int,
  "ST_General" int,
  "ST_Ladies" int,
  "VJ_DT_General" int,
  "VJ_DT_Ladies" int,
  "NTB_General" int,
  "NTB_Ladies" int,
  "NTC_General" int,
  "NTC_Ladies" int,
  "NTD_General" int,
  "NTD_Ladies" int,
  "OBC_General" int,
  "OBC_Ladies" int,
  "SEBC_General" int,
  "SEBC_Ladies" int,
  "Total" int,
  "PWD_total" int,
  "PWD_common_reserved" int,
  "DEF_total" int,
  "DEF_common_reserved" int,
  "EWS_seat" int,
  "TFWS_choice_code" text,
  "TFWS_seats" int
);

create table if not exists public."2024_mht_cet_round_one_cutoffs_duplicate" (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  college_code text,
  college_name text,
  course_code text,
  course_name text,
  category text,
  seat_allocation_section text,
  cutoff_score numeric,
  last_rank bigint,
  total_admitted int,
  status text,
  home_university text
);

create table if not exists public."2024_mht_cet_round_two_cutoffs" (
  like public."2024_mht_cet_round_one_cutoffs_duplicate" including all
);

create table if not exists public."2024_mht_cet_round_three_cutoffs" (
  like public."2024_mht_cet_round_one_cutoffs_duplicate" including all
);

create table if not exists public."2025_mht_cet_round_one_cutoffs" (
  like public."2024_mht_cet_round_one_cutoffs_duplicate" including all
);

-- All India rounds
create table if not exists public."2024_all_india_rounds_one" (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  sr_no int,
  rank bigint,
  percentile numeric,
  choice_code text,
  institute_code text,
  merit_exam text,
  type text,
  seat_type text,
  college_code text,
  course_name text,
  college_name text
);

create table if not exists public."2024_all_india_rounds_two" (
  like public."2024_all_india_rounds_one" including all
);

create table if not exists public."2024_all_india_rounds_three" (
  like public."2024_all_india_rounds_one" including all
);

create table if not exists public.engineering_bits_cutoffs (
  id text primary key,
  created timestamptz default now(),
  updated timestamptz default now(),
  "Year" text,
  "Program" text,
  "Campus" text,
  "Degree" text,
  "Quotas" text,
  "Gender" text,
  "Opening" int,
  "Closing" int
);

-- Indexes for current query patterns
create index if not exists idx_josaa_institutes_original_id on public.josaa_institutes (original_id);
create index if not exists idx_josaa_branches_original_id on public.josaa_branches (original_id);
create index if not exists idx_josaa_cutoffs_institute_year on public.josaa_cutoffs (institute_id, year);
create index if not exists idx_josaa_cutoffs_branch_year on public.josaa_cutoffs (branch_id, year);
create index if not exists idx_josaa_cutoffs_round_category_gender on public.josaa_cutoffs (round, category, gender);
create index if not exists idx_josaa_institutes_name_trgm on public.josaa_institutes using gin (name gin_trgm_ops);
create index if not exists idx_josaa_branches_name_trgm on public.josaa_branches using gin (name gin_trgm_ops);
create index if not exists idx_josaa_branches_short_code_trgm on public.josaa_branches using gin (short_code gin_trgm_ops);

create index if not exists idx_mht_colleges_college_id on public."2024_mht_cet_colleges" (college_id);
create index if not exists idx_mht_colleges_name_trgm on public."2024_mht_cet_colleges" using gin (college_name gin_trgm_ops);
create index if not exists idx_mht_seat_matrix_college_code on public."2024_mht_cet_colleges_seat_matrix" (college_code);

create index if not exists idx_mht_round1_college_code on public."2024_mht_cet_round_one_cutoffs_duplicate" (college_code);
create index if not exists idx_mht_round1_cutoff_score on public."2024_mht_cet_round_one_cutoffs_duplicate" (cutoff_score);
create index if not exists idx_mht_round1_last_rank on public."2024_mht_cet_round_one_cutoffs_duplicate" (last_rank);
create index if not exists idx_mht_round1_college_course_trgm on public."2024_mht_cet_round_one_cutoffs_duplicate" using gin (college_name gin_trgm_ops, course_name gin_trgm_ops);

create index if not exists idx_mht_round2_college_code on public."2024_mht_cet_round_two_cutoffs" (college_code);
create index if not exists idx_mht_round3_college_code on public."2024_mht_cet_round_three_cutoffs" (college_code);
create index if not exists idx_mht_2025_round1_college_code on public."2025_mht_cet_round_one_cutoffs" (college_code);

create index if not exists idx_all_india_round1_rank on public."2024_all_india_rounds_one" (rank);
create index if not exists idx_all_india_round1_percentile on public."2024_all_india_rounds_one" (percentile);
create index if not exists idx_all_india_round1_college_name_trgm on public."2024_all_india_rounds_one" using gin (college_name gin_trgm_ops, course_name gin_trgm_ops, choice_code gin_trgm_ops);

create index if not exists idx_all_india_round2_rank on public."2024_all_india_rounds_two" (rank);
create index if not exists idx_all_india_round3_rank on public."2024_all_india_rounds_three" (rank);

create index if not exists idx_bits_year on public.engineering_bits_cutoffs ("Year");

-- RLS model:
-- Read access for anon/authenticated users on public data tables,
-- write access only with service role.
alter table public.josaa_institutes enable row level security;
alter table public.josaa_branches enable row level security;
alter table public.josaa_cutoffs enable row level security;
alter table public.josaa_institute_aliases enable row level security;
alter table public."2024_mht_cet_colleges" enable row level security;
alter table public."2024_mht_cet_colleges_seat_matrix" enable row level security;
alter table public."2024_mht_cet_round_one_cutoffs_duplicate" enable row level security;
alter table public."2024_mht_cet_round_two_cutoffs" enable row level security;
alter table public."2024_mht_cet_round_three_cutoffs" enable row level security;
alter table public."2025_mht_cet_round_one_cutoffs" enable row level security;
alter table public."2024_all_india_rounds_one" enable row level security;
alter table public."2024_all_india_rounds_two" enable row level security;
alter table public."2024_all_india_rounds_three" enable row level security;
alter table public.engineering_bits_cutoffs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'josaa_institutes' and policyname = 'public read josaa institutes'
  ) then
    create policy "public read josaa institutes" on public.josaa_institutes for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'josaa_branches' and policyname = 'public read josaa branches'
  ) then
    create policy "public read josaa branches" on public.josaa_branches for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'josaa_cutoffs' and policyname = 'public read josaa cutoffs'
  ) then
    create policy "public read josaa cutoffs" on public.josaa_cutoffs for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'josaa_institute_aliases' and policyname = 'public read josaa institute aliases'
  ) then
    create policy "public read josaa institute aliases" on public.josaa_institute_aliases for select using (true);
  end if;
end $$;
