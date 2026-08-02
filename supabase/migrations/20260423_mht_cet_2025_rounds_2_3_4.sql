-- 2025 MHT-CET CAP Rounds 2, 3, 4 cutoff tables.
-- Explicit column DDL (no LIKE template dependency).
-- Schema matches public."2025_mht_cet_round_one_cutoffs".
--
-- Apply via Supabase SQL editor. Idempotent.

create table if not exists public."2025_mht_cet_round_two_cutoffs" (
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
create table if not exists public."2025_mht_cet_round_three_cutoffs" (
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
create table if not exists public."2025_mht_cet_round_four_cutoffs" (
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
-- pg_trgm is required for the gin trgm indexes (no-op if already installed).
create extension if not exists pg_trgm;
-- Round 2 indexes
create index if not exists idx_mht_2025_round2_college_code
  on public."2025_mht_cet_round_two_cutoffs" (college_code);
create index if not exists idx_mht_2025_round2_cutoff_score
  on public."2025_mht_cet_round_two_cutoffs" (cutoff_score);
create index if not exists idx_mht_2025_round2_last_rank
  on public."2025_mht_cet_round_two_cutoffs" (last_rank);
create index if not exists idx_mht_2025_round2_college_course_trgm
  on public."2025_mht_cet_round_two_cutoffs"
  using gin (college_name gin_trgm_ops, course_name gin_trgm_ops);
-- Round 3 indexes
create index if not exists idx_mht_2025_round3_college_code
  on public."2025_mht_cet_round_three_cutoffs" (college_code);
create index if not exists idx_mht_2025_round3_cutoff_score
  on public."2025_mht_cet_round_three_cutoffs" (cutoff_score);
create index if not exists idx_mht_2025_round3_last_rank
  on public."2025_mht_cet_round_three_cutoffs" (last_rank);
create index if not exists idx_mht_2025_round3_college_course_trgm
  on public."2025_mht_cet_round_three_cutoffs"
  using gin (college_name gin_trgm_ops, course_name gin_trgm_ops);
-- Round 4 indexes
create index if not exists idx_mht_2025_round4_college_code
  on public."2025_mht_cet_round_four_cutoffs" (college_code);
create index if not exists idx_mht_2025_round4_cutoff_score
  on public."2025_mht_cet_round_four_cutoffs" (cutoff_score);
create index if not exists idx_mht_2025_round4_last_rank
  on public."2025_mht_cet_round_four_cutoffs" (last_rank);
create index if not exists idx_mht_2025_round4_college_course_trgm
  on public."2025_mht_cet_round_four_cutoffs"
  using gin (college_name gin_trgm_ops, course_name gin_trgm_ops);
-- RLS (matches existing MHT-CET tables).
alter table public."2025_mht_cet_round_two_cutoffs" enable row level security;
alter table public."2025_mht_cet_round_three_cutoffs" enable row level security;
alter table public."2025_mht_cet_round_four_cutoffs" enable row level security;
-- Force PostgREST schema cache reload so the new tables become queryable.
notify pgrst, 'reload schema';
