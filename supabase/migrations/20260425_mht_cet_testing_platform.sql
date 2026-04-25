create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.mht_cet_question_sources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_type text not null check (source_type in ('official_notice', 'official_mock', 'candidate_export', 'licensed_provider', 'manual_entry', 'test_fixture')),
  title text not null,
  year int check (year between 2000 and 2100),
  exam_group text not null default 'pcm' check (exam_group in ('pcm', 'pcb')),
  source_url text,
  file_name text,
  file_sha256 text,
  license_note text not null,
  verification_status text not null default 'draft' check (verification_status in ('draft', 'validated', 'approved', 'rejected', 'archived')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  unique (file_sha256)
);

create table if not exists public.mht_cet_chapters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subject text not null check (subject in ('mathematics', 'physics', 'chemistry')),
  standard int not null check (standard in (11, 12)),
  slug text not null,
  name text not null,
  official boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  unique (subject, standard, slug)
);

insert into public.mht_cet_chapters (subject, standard, slug, name, official, active, sort_order)
values
  ('physics', 11, 'motion-in-a-plane', 'Motion in a plane', true, true, 1),
  ('physics', 11, 'laws-of-motion', 'Laws of Motion', true, true, 2),
  ('physics', 11, 'gravitation', 'Gravitation', true, true, 3),
  ('physics', 11, 'thermal-properties-of-matter', 'Thermal properties of matter', true, true, 4),
  ('physics', 11, 'sound', 'Sound', true, true, 5),
  ('physics', 11, 'optics', 'Optics', true, true, 6),
  ('physics', 11, 'electrostatics', 'Electrostatics', true, true, 7),
  ('physics', 11, 'semiconductors', 'Semiconductors', true, true, 8),
  ('chemistry', 11, 'some-basic-concepts-of-chemistry', 'Some Basic concepts of chemistry', true, true, 1),
  ('chemistry', 11, 'structure-of-atom', 'Structure of atom', true, true, 2),
  ('chemistry', 11, 'chemical-bonding', 'Chemical Bonding', true, true, 3),
  ('chemistry', 11, 'redox-reactions', 'Redox reactions', true, true, 4),
  ('chemistry', 11, 'elements-of-group-1-and-2', 'Elements of group 1 and 2', true, true, 5),
  ('chemistry', 11, 'states-of-matter', 'States of Matter (Gaseous and Liquids)', true, true, 6),
  ('chemistry', 11, 'adsorption-and-colloids', 'Adsorption and colloids (Surface Chemistry)', true, true, 7),
  ('chemistry', 11, 'hydrocarbons', 'Hydrocarbons', true, true, 8),
  ('chemistry', 11, 'basic-principles-of-organic-chemistry', 'Basic principles of organic chemistry', true, true, 9),
  ('mathematics', 11, 'trigonometry-ii', 'Trigonometry II', true, true, 1),
  ('mathematics', 11, 'straight-line', 'Straight Line', true, true, 2),
  ('mathematics', 11, 'circle', 'Circle', true, true, 3),
  ('mathematics', 11, 'measures-of-dispersion', 'Measures of Dispersion', true, true, 4),
  ('mathematics', 11, 'probability', 'Probability', true, true, 5),
  ('mathematics', 11, 'complex-numbers', 'Complex Numbers', true, true, 6),
  ('mathematics', 11, 'permutations-and-combinations', 'Permutations and Combinations', true, true, 7),
  ('mathematics', 11, 'functions', 'Functions', true, true, 8),
  ('mathematics', 11, 'limits', 'Limits', true, true, 9),
  ('mathematics', 11, 'continuity', 'Continuity', true, true, 10)
on conflict (subject, standard, slug) do update set
  name = excluded.name,
  official = excluded.official,
  active = excluded.active,
  sort_order = excluded.sort_order;

create table if not exists public.mht_cet_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_id uuid not null references public.mht_cet_question_sources(id) on delete restrict,
  chapter_id uuid references public.mht_cet_chapters(id),
  year int check (year between 2000 and 2100),
  exam_group text not null default 'pcm' check (exam_group in ('pcm', 'pcb')),
  subject text not null check (subject in ('mathematics', 'physics', 'chemistry')),
  difficulty text not null default 'unknown' check (difficulty in ('unknown', 'easy', 'medium', 'hard')),
  question_type text not null default 'single_correct' check (question_type in ('single_correct')),
  marks numeric not null check (marks > 0),
  negative_marks numeric not null default 0 check (negative_marks >= 0),
  body jsonb not null,
  body_text text not null,
  body_sha256 text not null,
  verification_status text not null default 'draft' check (verification_status in ('draft', 'validated', 'approved', 'rejected', 'archived')),
  quality_flags text[] not null default '{}',
  unique (body_sha256, source_id)
);

create table if not exists public.mht_cet_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.mht_cet_questions(id) on delete cascade,
  option_order int not null check (option_order between 1 and 8),
  body jsonb not null,
  body_text text not null,
  unique (question_id, option_order)
);

create table if not exists public.mht_cet_question_answers (
  question_id uuid primary key references public.mht_cet_questions(id) on delete cascade,
  correct_option_ids uuid[] not null,
  explanation jsonb,
  explanation_text text,
  updated_at timestamptz not null default now()
);

create table if not exists public.mht_cet_question_import_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_id uuid not null references public.mht_cet_question_sources(id) on delete restrict,
  imported_by uuid references auth.users(id),
  file_name text not null,
  file_sha256 text not null,
  total_rows int not null default 0,
  accepted_rows int not null default 0,
  rejected_rows int not null default 0,
  status text not null default 'validated' check (status in ('validated', 'imported', 'failed'))
);

create table if not exists public.mht_cet_question_import_errors (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.mht_cet_question_import_batches(id) on delete cascade,
  row_number int not null,
  field_name text not null,
  severity text not null check (severity in ('warning', 'error')),
  message text not null
);

create table if not exists public.mht_cet_mock_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'expired', 'abandoned')),
  exam_group text not null default 'pcm' check (exam_group in ('pcm', 'pcb')),
  duration_seconds int not null check (duration_seconds between 300 and 21600),
  seed text not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  submitted_at timestamptz,
  question_count int not null default 0,
  score_raw numeric not null default 0,
  max_score numeric not null default 0,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  unanswered_count int not null default 0,
  time_spent_seconds int not null default 0,
  config jsonb not null default '{}'
);

create table if not exists public.mht_cet_mock_attempt_questions (
  attempt_id uuid not null references public.mht_cet_mock_attempts(id) on delete cascade,
  question_id uuid not null references public.mht_cet_questions(id) on delete restrict,
  position int not null,
  subject text not null check (subject in ('mathematics', 'physics', 'chemistry')),
  chapter_id uuid references public.mht_cet_chapters(id),
  marks numeric not null,
  primary key (attempt_id, question_id),
  unique (attempt_id, position)
);

create table if not exists public.mht_cet_mock_responses (
  attempt_id uuid not null,
  question_id uuid not null,
  selected_option_ids uuid[] not null default '{}',
  visited boolean not null default false,
  marked_for_review boolean not null default false,
  time_spent_seconds int not null default 0 check (time_spent_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (attempt_id, question_id),
  foreign key (attempt_id, question_id)
    references public.mht_cet_mock_attempt_questions(attempt_id, question_id)
    on delete cascade
);

create table if not exists public.mht_cet_mock_attempt_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.mht_cet_mock_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'response_saved', 'submitted', 'expired')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_mht_cet_questions_approved_lookup
  on public.mht_cet_questions (exam_group, subject, year, verification_status);
create index if not exists idx_mht_cet_questions_chapter
  on public.mht_cet_questions (chapter_id);
create index if not exists idx_mht_cet_questions_body_trgm
  on public.mht_cet_questions using gin (body_text gin_trgm_ops);
create index if not exists idx_mht_cet_attempts_user
  on public.mht_cet_mock_attempts (user_id, created_at desc);
create index if not exists idx_mht_cet_attempt_events_attempt
  on public.mht_cet_mock_attempt_events (attempt_id, created_at desc);

alter table public.mht_cet_question_sources enable row level security;
alter table public.mht_cet_chapters enable row level security;
alter table public.mht_cet_questions enable row level security;
alter table public.mht_cet_question_options enable row level security;
alter table public.mht_cet_question_answers enable row level security;
alter table public.mht_cet_question_import_batches enable row level security;
alter table public.mht_cet_question_import_errors enable row level security;
alter table public.mht_cet_mock_attempts enable row level security;
alter table public.mht_cet_mock_attempt_questions enable row level security;
alter table public.mht_cet_mock_responses enable row level security;
alter table public.mht_cet_mock_attempt_events enable row level security;

create policy "public read active chapters" on public.mht_cet_chapters
  for select using (active = true);
create policy "public read approved questions" on public.mht_cet_questions
  for select using (
    verification_status = 'approved'
    and exists (
      select 1 from public.mht_cet_question_sources s
      where s.id = source_id and s.verification_status = 'approved'
    )
  );
create policy "public read approved options" on public.mht_cet_question_options
  for select using (
    exists (
      select 1
      from public.mht_cet_questions q
      join public.mht_cet_question_sources s on s.id = q.source_id
      where q.id = question_id
        and q.verification_status = 'approved'
        and s.verification_status = 'approved'
    )
  );
create policy "users read own attempts" on public.mht_cet_mock_attempts
  for select using ((select auth.uid()) = user_id);
create policy "users insert own attempts" on public.mht_cet_mock_attempts
  for insert with check ((select auth.uid()) = user_id);
create policy "users update own attempts" on public.mht_cet_mock_attempts
  for update using ((select auth.uid()) = user_id);
create policy "users read own attempt questions" on public.mht_cet_mock_attempt_questions
  for select using (
    exists (
      select 1 from public.mht_cet_mock_attempts a
      where a.id = attempt_id and a.user_id = (select auth.uid())
    )
  );
create policy "users read own responses" on public.mht_cet_mock_responses
  for select using (
    exists (
      select 1 from public.mht_cet_mock_attempts a
      where a.id = attempt_id and a.user_id = (select auth.uid())
    )
  );
create policy "users read own attempt events" on public.mht_cet_mock_attempt_events
  for select using (user_id = (select auth.uid()));
create policy "users upsert own responses" on public.mht_cet_mock_responses
  for all using (
    exists (
      select 1 from public.mht_cet_mock_attempts a
      where a.id = attempt_id and a.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.mht_cet_mock_attempts a
      where a.id = attempt_id
        and a.user_id = (select auth.uid())
        and a.status = 'in_progress'
        and a.ends_at > now()
    )
  );

notify pgrst, 'reload schema';