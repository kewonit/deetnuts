# MHT-CET Testing Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reliable MHT-CET mock-test platform with verified question imports, safe rendering, timed attempts, Supabase-backed scoring, and student stats.

**Architecture:** Supabase stores verified question sources, canonical chapters, question bodies, answer keys, attempts, responses, and result views. Next.js App Router route handlers own attempt creation, autosave, submission, and result access so answer keys never reach the browser before submission. React client components render the mock builder, timed attempt UI, and stats tables.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Postgres/Auth/RLS, Tailwind CSS 3.4, node:test, Zod, KaTeX, TanStack Table, Recharts.

**Source Policy:** Do not seed fake MHT-CET questions. Import only local fixtures clearly marked as test data or externally supplied source files with URL/hash/license metadata. Public mocks show only questions with `verification_status = 'approved'`.

**Git Policy:** Do not commit changes. The user handles all commits manually.

---

## Phase 0: Source Governance And Product Boundaries

**Outcome:** The app can distinguish verified, unverified, rejected, and test-only question data before any public mock exists.

**Files:**

- Create: `docs/MHT_CET_TESTING_PLATFORM_SOURCES.md`
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Document official source findings**

  Add `docs/MHT_CET_TESTING_PLATFORM_SOURCES.md` with:

  ```markdown
  # MHT-CET Testing Platform Sources

  ## Official Sources Checked

  - CET Cell home: https://cetcell.mahacet.org/
  - Syllabus index: https://cetcell.mahacet.org/syllabus-and-marking-scheme/
  - 2024 technical syllabus PDF: https://cetcell.mahacet.org/wp-content/uploads/2023/08/Technical_Education_CET_syllabus2024-25.pdf
  - 2026 normalization PDF: https://cetcell.mahacet.org/wp-content/uploads/2023/12/MHT-CET-2026-Result-Processing-Methodology.pdf
  - 2025 mock-test links PDF: https://cetcell.mahacet.org/wp-content/uploads/2023/12/Mocktest_links-3.pdf
  - 2025 PCM objection notice: https://cetcell.mahacet.org/wp-content/uploads/2023/12/Notice_OT_-MHT-CET-PCM.pdf

  ## Import Rule

  Public mocks may only use questions whose source row is approved and whose imported question row is approved.
  Candidate-login or time-window material must be imported only from files supplied by an authorized operator.
  Test fixtures must be marked with source_type `test_fixture` and must not be mixed with production mocks.
  ```

- [ ] **Step 2: Update architecture docs**

  Add a short section to `docs/ARCHITECTURE.md` under Data Domains:

  ```markdown
  ### MHT-CET Mock Tests

  Planned testing-platform tables use Supabase-first access. Question imports are source-audited and reviewed before publication. Answer keys are stored separately from public question bodies so students cannot retrieve correct answers during active attempts.
  ```

- [ ] **Step 3: Verify documentation formatting**

  Run:

  ```powershell
  npx prettier --check docs/MHT_CET_TESTING_PLATFORM_SOURCES.md docs/ARCHITECTURE.md
  ```

  Expected: Prettier reports both markdown files are formatted.

---

## Phase 1: Supabase Schema, RLS, And Seed Chapters

**Outcome:** Database structures exist for source governance, question review, attempts, responses, and stats without answer-key leakage.

**Files:**

- Create: `supabase/migrations/20260425_mht_cet_testing_platform.sql`
- Create: `data/mht-cet/question-bank/chapters.json`
- Create: `lib/mht-cet/tests/schema.ts`
- Test: `lib/mht-cet/tests/schema.test.ts`

- [ ] **Step 1: Write failing schema constant tests**

  Create `lib/mht-cet/tests/schema.test.ts`:

  ```typescript
  import assert from "node:assert/strict";
  import test from "node:test";

  import {
    ATTEMPT_STATUSES,
    QUESTION_STATUSES,
    SUBJECTS,
    SOURCE_TYPES,
  } from "./schema";

  test("MHT-CET schema constants include review and attempt states", () => {
    assert.deepEqual(SUBJECTS, ["mathematics", "physics", "chemistry"]);
    assert.deepEqual(QUESTION_STATUSES, [
      "draft",
      "validated",
      "approved",
      "rejected",
      "archived",
    ]);
    assert.deepEqual(ATTEMPT_STATUSES, [
      "in_progress",
      "submitted",
      "expired",
      "abandoned",
    ]);
    assert.ok(SOURCE_TYPES.includes("official_notice"));
    assert.ok(SOURCE_TYPES.includes("licensed_provider"));
    assert.ok(SOURCE_TYPES.includes("test_fixture"));
  });
  ```

- [ ] **Step 2: Run the failing schema test**

  Run:

  ```powershell
  npx tsx --test lib/mht-cet/tests/schema.test.ts
  ```

  Expected: FAIL because `lib/mht-cet/tests/schema.ts` does not exist.

- [ ] **Step 3: Create schema constants**

  Create `lib/mht-cet/tests/schema.ts`:

  ```typescript
  export const SUBJECTS = ["mathematics", "physics", "chemistry"] as const;

  export const QUESTION_STATUSES = [
    "draft",
    "validated",
    "approved",
    "rejected",
    "archived",
  ] as const;

  export const SOURCE_TYPES = [
    "official_notice",
    "official_mock",
    "candidate_export",
    "licensed_provider",
    "manual_entry",
    "test_fixture",
  ] as const;

  export const ATTEMPT_STATUSES = [
    "in_progress",
    "submitted",
    "expired",
    "abandoned",
  ] as const;

  export type MhtCetSubject = (typeof SUBJECTS)[number];
  export type MhtCetQuestionStatus = (typeof QUESTION_STATUSES)[number];
  export type MhtCetSourceType = (typeof SOURCE_TYPES)[number];
  export type MhtCetAttemptStatus = (typeof ATTEMPT_STATUSES)[number];
  ```

- [ ] **Step 4: Run schema test again**

  Run:

  ```powershell
  npx tsx --test lib/mht-cet/tests/schema.test.ts
  ```

  Expected: PASS.

- [ ] **Step 5: Add canonical chapter seed data**

  Create `data/mht-cet/question-bank/chapters.json` with official Std XI chapters from the extractable 2024 syllabus PDF and a reserved Std XII chapter list that must be filled from supplied official source files before public use:

  ```json
  [
    {
      "subject": "physics",
      "standard": 11,
      "slug": "motion-in-a-plane",
      "name": "Motion in a plane",
      "official": true
    },
    {
      "subject": "physics",
      "standard": 11,
      "slug": "laws-of-motion",
      "name": "Laws of Motion",
      "official": true
    },
    {
      "subject": "physics",
      "standard": 11,
      "slug": "gravitation",
      "name": "Gravitation",
      "official": true
    },
    {
      "subject": "physics",
      "standard": 11,
      "slug": "thermal-properties-of-matter",
      "name": "Thermal properties of matter",
      "official": true
    },
    {
      "subject": "physics",
      "standard": 11,
      "slug": "sound",
      "name": "Sound",
      "official": true
    },
    {
      "subject": "physics",
      "standard": 11,
      "slug": "optics",
      "name": "Optics",
      "official": true
    },
    {
      "subject": "physics",
      "standard": 11,
      "slug": "electrostatics",
      "name": "Electrostatics",
      "official": true
    },
    {
      "subject": "physics",
      "standard": 11,
      "slug": "semiconductors",
      "name": "Semiconductors",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "some-basic-concepts-of-chemistry",
      "name": "Some Basic concepts of chemistry",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "structure-of-atom",
      "name": "Structure of atom",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "chemical-bonding",
      "name": "Chemical Bonding",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "redox-reactions",
      "name": "Redox reactions",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "elements-of-group-1-and-2",
      "name": "Elements of group 1 and 2",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "states-of-matter",
      "name": "States of Matter (Gaseous and Liquids)",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "adsorption-and-colloids",
      "name": "Adsorption and colloids (Surface Chemistry)",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "hydrocarbons",
      "name": "Hydrocarbons",
      "official": true
    },
    {
      "subject": "chemistry",
      "standard": 11,
      "slug": "basic-principles-of-organic-chemistry",
      "name": "Basic principles of organic chemistry",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "trigonometry-ii",
      "name": "Trigonometry II",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "straight-line",
      "name": "Straight Line",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "circle",
      "name": "Circle",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "measures-of-dispersion",
      "name": "Measures of Dispersion",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "probability",
      "name": "Probability",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "complex-numbers",
      "name": "Complex Numbers",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "permutations-and-combinations",
      "name": "Permutations and Combinations",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "functions",
      "name": "Functions",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "limits",
      "name": "Limits",
      "official": true
    },
    {
      "subject": "mathematics",
      "standard": 11,
      "slug": "continuity",
      "name": "Continuity",
      "official": true
    }
  ]
  ```

- [ ] **Step 6: Create Supabase migration**

  Create `supabase/migrations/20260425_mht_cet_testing_platform.sql` with:

  ```sql
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
    attempt_id uuid not null references public.mht_cet_mock_attempts(id) on delete cascade,
    question_id uuid not null references public.mht_cet_questions(id) on delete restrict,
    selected_option_ids uuid[] not null default '{}',
    visited boolean not null default false,
    marked_for_review boolean not null default false,
    time_spent_seconds int not null default 0 check (time_spent_seconds >= 0),
    updated_at timestamptz not null default now(),
    primary key (attempt_id, question_id)
  );

  create index if not exists idx_mht_cet_questions_approved_lookup
    on public.mht_cet_questions (exam_group, subject, year, verification_status);
  create index if not exists idx_mht_cet_questions_chapter
    on public.mht_cet_questions (chapter_id);
  create index if not exists idx_mht_cet_questions_body_trgm
    on public.mht_cet_questions using gin (body_text gin_trgm_ops);
  create index if not exists idx_mht_cet_attempts_user
    on public.mht_cet_mock_attempts (user_id, created_at desc);

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

  create policy "public read active chapters" on public.mht_cet_chapters
    for select using (active = true);
  create policy "public read approved questions" on public.mht_cet_questions
    for select using (verification_status = 'approved');
  create policy "public read approved options" on public.mht_cet_question_options
    for select using (
      exists (
        select 1 from public.mht_cet_questions q
        where q.id = question_id and q.verification_status = 'approved'
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
  create policy "users upsert own responses" on public.mht_cet_mock_responses
    for all using (
      exists (
        select 1 from public.mht_cet_mock_attempts a
        where a.id = attempt_id and a.user_id = (select auth.uid())
      )
    );

  notify pgrst, 'reload schema';
  ```

- [ ] **Step 7: Run lint and type checks after adding types**

  Run:

  ```powershell
  npm run lint
  npx tsc --noEmit
  ```

  Expected: No new lint or TypeScript errors from the schema constants.

---

## Phase 2: Import Validation And Question Quality Pipeline

**Outcome:** Operators can validate question-bank JSON before import, and invalid/unverified content is blocked.

**Files:**

- Create: `lib/mht-cet/questions/content-schema.ts`
- Create: `lib/mht-cet/questions/validate-question-import.ts`
- Create: `lib/mht-cet/questions/hash-question.ts`
- Create: `lib/mht-cet/questions/validate-question-import.test.ts`
- Create: `scripts/validate-mht-cet-question-bank.ts`
- Create: `scripts/import-mht-cet-question-bank.ts`
- Create: `data/mht-cet/question-bank/sample-fixture.json`

- [ ] **Step 1: Write failing import validation tests**

  Create `lib/mht-cet/questions/validate-question-import.test.ts` with tests for:
  - Valid single-correct question passes.
  - Missing source metadata fails.
  - Correct option ID not present in options fails.
  - Raw HTML block fails.
  - Duplicate option IDs fail.
  - `test_fixture` rows cannot be approved for production import.

  Run:

  ```powershell
  npx tsx --test lib/mht-cet/questions/validate-question-import.test.ts
  ```

  Expected: FAIL because validation code does not exist.

- [ ] **Step 2: Implement Zod content schema**

  Create `lib/mht-cet/questions/content-schema.ts` with `QuestionBlockSchema`, `QuestionOptionSchema`, `QuestionImportRowSchema`, and exported TypeScript types. Only these block types are accepted: `paragraph`, `math`, `image`, `table`, `list`.

- [ ] **Step 3: Implement deterministic hashing**

  Create `lib/mht-cet/questions/hash-question.ts` using Node `crypto.createHash("sha256")` over normalized question body, subject, options, and source metadata. Sort object keys before hashing so equivalent JSON hashes consistently.

- [ ] **Step 4: Implement validator**

  Create `lib/mht-cet/questions/validate-question-import.ts` that returns:

  ```typescript
  export type QuestionImportValidationResult = {
    validRows: ValidatedQuestionImportRow[];
    errors: Array<{
      rowNumber: number;
      fieldName: string;
      severity: "warning" | "error";
      message: string;
    }>;
  };
  ```

  Rules:
  - Require `source.title`, `source.sourceType`, and `source.licenseNote`.
  - Require `source.fileSha256` or `source.sourceUrl`.
  - Require subject in `mathematics`, `physics`, `chemistry`.
  - Require at least two options.
  - Require exactly one correct option for `single_correct`.
  - Reject raw HTML-like strings containing `<script`, `<iframe`, or `onerror=`.
  - Warn for missing explanations.
  - Warn for missing chapter slug.
  - Mark `test_fixture` source rows as importable only in non-production mode.

- [ ] **Step 5: Add sample fixture data**

  Create `data/mht-cet/question-bank/sample-fixture.json` with three clearly labeled non-official sample questions. Each question must include `sourceType: "test_fixture"`, `licenseNote: "Local test fixture for renderer and scoring development; not official MHT-CET content."`, and simple content that avoids copyrighted question text.

- [ ] **Step 6: Implement validation script**

  Create `scripts/validate-mht-cet-question-bank.ts`:
  - Reads a JSON path argument.
  - Validates rows with the library validator.
  - Prints accepted and rejected counts.
  - Exits with code `1` if any error severity is `error`.

- [ ] **Step 7: Run red/green validation tests**

  Run:

  ```powershell
  npx tsx --test lib/mht-cet/questions/validate-question-import.test.ts
  npx tsx scripts/validate-mht-cet-question-bank.ts data/mht-cet/question-bank/sample-fixture.json
  ```

  Expected: Tests pass, fixture validates with warnings allowed only for intentionally missing optional fields.

---

## Phase 3: Safe Question Renderer

**Outcome:** Question content, options, explanations, math, images, and tables render safely and consistently on desktop/mobile.

**Files:**

- Modify: `package.json`
- Create: `components/mht-cet/questions/QuestionContent.tsx`
- Create: `components/mht-cet/questions/QuestionContent.test.tsx`
- Create: `components/mht-cet/questions/question-content.css`

- [ ] **Step 1: Add renderer dependency**

  Install KaTeX:

  ```powershell
  npm install katex
  npm install --save-dev @types/katex
  ```

- [ ] **Step 2: Write failing renderer tests**

  Create `components/mht-cet/questions/QuestionContent.test.tsx` using `renderToStaticMarkup` and assert:
  - Paragraph text appears.
  - Display math renders KaTeX HTML/MathML.
  - Invalid math does not throw.
  - Raw HTML-like text is escaped.
  - Image block requires alt text.

- [ ] **Step 3: Implement renderer**

  Create `components/mht-cet/questions/QuestionContent.tsx`:
  - Accepts `blocks` and `variant` props.
  - Uses `katex.renderToString(tex, { throwOnError: false, trust: false, strict: "warn", output: "htmlAndMathml" })`.
  - Uses `dangerouslySetInnerHTML` only for KaTeX output generated by KaTeX.
  - Renders tables with responsive overflow.
  - Renders images with fixed max width and alt text.

- [ ] **Step 4: Add renderer CSS**

  Add `components/mht-cet/questions/question-content.css` for KaTeX sizing, table overflow, long-word wrapping, and image constraints.

- [ ] **Step 5: Run renderer tests**

  Run:

  ```powershell
  npx tsx --test components/mht-cet/questions/QuestionContent.test.tsx
  npm run lint
  npx tsc --noEmit
  ```

  Expected: Renderer tests pass and no new lint/type errors appear.

---

## Phase 4: Mock Generation And Scoring Logic

**Outcome:** Pure TypeScript services can create mock blueprints and score attempts without touching UI.

**Files:**

- Create: `lib/mht-cet/mock-tests/config.ts`
- Create: `lib/mht-cet/mock-tests/select-questions.ts`
- Create: `lib/mht-cet/mock-tests/score-attempt.ts`
- Create: `lib/mht-cet/mock-tests/config.test.ts`
- Create: `lib/mht-cet/mock-tests/select-questions.test.ts`
- Create: `lib/mht-cet/mock-tests/score-attempt.test.ts`

- [ ] **Step 1: Write failing config tests**

  Test cases:
  - Full PCM default returns 150 questions and 10800 seconds.
  - Mathematics default returns 50 questions and 5400 seconds.
  - Physics/Chemistry default returns 100 questions and 5400 seconds.
  - Custom duration clamps between 300 and 21600 seconds.
  - Empty chapter selection means all active chapters for selected subjects.

- [ ] **Step 2: Implement config helpers**

  Create `lib/mht-cet/mock-tests/config.ts` with `normalizeMockConfig(input)` and exported default configurations.

- [ ] **Step 3: Write failing selection tests**

  Test deterministic selection by seed, insufficient-question errors, subject ratio handling, and stable ordering.

- [ ] **Step 4: Implement question selection**

  Create `selectQuestionsForMock({ pool, config, seed })` that:
  - Filters approved questions by subject, year, and chapter.
  - Uses a deterministic seeded shuffle.
  - Returns a typed error when pool size is insufficient.
  - Never mutates the input pool.

- [ ] **Step 5: Write failing scoring tests**

  Test correct, wrong, unanswered, marked-for-review but unanswered, no negative marking, and multi-response rejection for single-correct questions.

- [ ] **Step 6: Implement scoring**

  Create `scoreAttempt({ questions, answers, responses })` that:
  - Uses set equality between selected and correct option IDs.
  - Gives full marks for correct answers.
  - Gives zero for wrong or unanswered answers.
  - Computes raw score, max score, counts, subject stats, and chapter stats.

- [ ] **Step 7: Run logic tests**

  Run:

  ```powershell
  npx tsx --test lib/mht-cet/mock-tests/config.test.ts
  npx tsx --test lib/mht-cet/mock-tests/select-questions.test.ts
  npx tsx --test lib/mht-cet/mock-tests/score-attempt.test.ts
  ```

  Expected: All logic tests pass.

---

## Phase 5: Server API And Supabase Access Layer

**Outcome:** Authenticated users can create attempts, autosave responses, submit attempts, and fetch results through server routes.

**Files:**

- Create: `lib/mht-cet/mock-tests/supabase.ts`
- Create: `app/api/mht-cet/mock-tests/route.ts`
- Create: `app/api/mht-cet/mock-tests/attempts/[attemptId]/route.ts`
- Create: `app/api/mht-cet/mock-tests/attempts/[attemptId]/responses/route.ts`
- Create: `app/api/mht-cet/mock-tests/attempts/[attemptId]/submit/route.ts`
- Create: `app/api/mht-cet/mock-tests/attempts/[attemptId]/results/route.ts`

- [ ] **Step 1: Create server data-access module**

  Implement functions in `lib/mht-cet/mock-tests/supabase.ts`:
  - `getCurrentUserOrUnauthorized()`
  - `loadApprovedQuestionPool(config)`
  - `createAttemptWithQuestions(userId, config, selectedQuestions)`
  - `loadAttemptForUser(attemptId, userId)`
  - `upsertAttemptResponse(attemptId, userId, response)`
  - `submitAttempt(attemptId, userId)`
  - `loadAttemptResults(attemptId, userId)`

  Use Supabase server client for user-owned reads/writes. Use a server-only service-role client only when answer keys are required for scoring.

- [ ] **Step 2: Create attempt route**

  `POST /api/mht-cet/mock-tests` accepts config JSON, validates auth, normalizes config, loads approved question pool, creates an attempt, and returns `{ attemptId }`.

  Edge responses:
  - `401` unauthorized.
  - `422` invalid config.
  - `409` insufficient approved questions.
  - `500` unexpected server error without leaking secrets.

- [ ] **Step 3: Attempt read route**

  `GET /api/mht-cet/mock-tests/attempts/[attemptId]` returns attempt metadata, ordered questions, options, and saved responses. It never returns `mht_cet_question_answers`.

- [ ] **Step 4: Autosave route**

  `PUT /api/mht-cet/mock-tests/attempts/[attemptId]/responses` validates attempt ownership, status, expiry, question membership, selected option IDs, and time-spent bounds before upserting.

- [ ] **Step 5: Submit route**

  `POST /api/mht-cet/mock-tests/attempts/[attemptId]/submit` verifies ownership and status, loads answer keys server-side, computes score, updates the attempt summary, and returns the result URL.

- [ ] **Step 6: Results route**

  `GET /api/mht-cet/mock-tests/attempts/[attemptId]/results` returns summary stats and explanations only for submitted, expired, or abandoned attempts.

- [ ] **Step 7: Run API validation**

  Run:

  ```powershell
  npm run lint
  npx tsc --noEmit
  ```

  Expected: Routes compile without new lint or type errors.

---

## Phase 6: Student UI

**Outcome:** Students can build, take, submit, and review mocks through polished MHT-CET pages.

**Files:**

- Modify: `app/mht-cet/page.tsx`
- Create: `app/mht-cet/mock-tests/page.tsx`
- Create: `app/mht-cet/mock-tests/new/page.tsx`
- Create: `app/mht-cet/mock-tests/attempts/[attemptId]/page.tsx`
- Create: `app/mht-cet/mock-tests/attempts/[attemptId]/results/page.tsx`
- Create: `components/mht-cet/mock-tests/MockBuilder.tsx`
- Create: `components/mht-cet/mock-tests/AttemptShell.tsx`
- Create: `components/mht-cet/mock-tests/QuestionNavigator.tsx`
- Create: `components/mht-cet/mock-tests/TimerBar.tsx`
- Create: `components/mht-cet/mock-tests/ResultsSummary.tsx`
- Create: `components/mht-cet/mock-tests/StatsTables.tsx`

- [ ] **Step 1: Add MHT-CET landing card**

  Add a `Mock Tests` link in `app/mht-cet/page.tsx` using the existing neobrutalist card style.

- [ ] **Step 2: Build dashboard page**

  `app/mht-cet/mock-tests/page.tsx` displays recent attempts, start buttons, and source/reliability messaging. It should not include long instructional marketing text.

- [ ] **Step 3: Build mock builder**

  `MockBuilder.tsx` includes:
  - Segmented control for Full PCM, Mathematics, Physics/Chemistry, Custom.
  - Subject and chapter checkboxes.
  - Duration input/slider.
  - Question-count stepper.
  - Year/source filters.
  - Clear unavailable state when approved questions are insufficient.

- [ ] **Step 4: Build attempt UI**

  `AttemptShell.tsx` includes:
  - Fixed timer bar.
  - Question stem and options.
  - Save state indicator.
  - Previous/next controls.
  - Mark-for-review toggle.
  - Question navigator with answered/unanswered/review states.
  - Submit confirmation dialog.

- [ ] **Step 5: Build results UI**

  `ResultsSummary.tsx` and `StatsTables.tsx` include:
  - Score, max score, correct/wrong/unanswered.
  - Accuracy and time spent.
  - Subject table.
  - Chapter table.
  - Question review table with selected answer and correct answer.
  - Empty explanation fallback.

- [ ] **Step 6: Run UI checks**

  Run:

  ```powershell
  npm run lint
  npx tsc --noEmit
  npm run build
  ```

  Expected: Build completes. If unrelated existing warnings appear, record them without changing unrelated files.

---

## Phase 7: Admin Review And Import UI

**Outcome:** Admins can review imported questions, approve/reject them, and see why imports failed.

**Files:**

- Create: `app/mht-cet/admin/questions/page.tsx`
- Create: `app/mht-cet/admin/imports/page.tsx`
- Create: `app/api/mht-cet/admin/questions/[questionId]/review/route.ts`
- Create: `app/api/mht-cet/admin/imports/route.ts`
- Create: `lib/mht-cet/admin/auth.ts`
- Create: `components/mht-cet/admin/QuestionReviewPanel.tsx`
- Create: `components/mht-cet/admin/ImportBatchTable.tsx`

- [ ] **Step 1: Add admin auth helper**

  `lib/mht-cet/admin/auth.ts` reads `MHT_CET_ADMIN_EMAILS` from environment and checks the current Supabase user email server-side.

- [ ] **Step 2: Add import batch page**

  `app/mht-cet/admin/imports/page.tsx` lists batches, source status, accepted/rejected counts, and error rows.

- [ ] **Step 3: Add review page**

  `app/mht-cet/admin/questions/page.tsx` lists draft/validated questions with filters by source, subject, chapter, year, and quality flags.

- [ ] **Step 4: Add review mutation route**

  `POST /api/mht-cet/admin/questions/[questionId]/review` accepts `approved` or `rejected`, stores reviewer metadata, and refuses review if the source itself is not approved.

- [ ] **Step 5: Add import route**

  `POST /api/mht-cet/admin/imports` accepts a validated JSON upload, creates source and batch rows, inserts draft/validated questions, options, and answer keys with service role, and returns batch summary.

---

## Phase 8: Observability, Abuse Controls, And Robustness

**Outcome:** The platform behaves safely under repeated attempts, bad inputs, partial failures, and stale browser sessions.

**Files:**

- Create: `lib/mht-cet/mock-tests/rate-limit.ts`
- Create: `lib/mht-cet/mock-tests/events.ts`
- Modify: mock-test API routes from Phase 5

- [ ] **Step 1: Rate-limit attempt creation**

  Limit active in-progress attempts per user and per hour. Return `429` with a helpful error object when exceeded.

- [ ] **Step 2: Add attempt events**

  Record `created`, `autosaved`, `submitted`, `expired`, and `late_submit_rejected` events in `mht_cet_mock_attempt_events`.

- [ ] **Step 3: Add server clock authority**

  Use `ends_at` from the database for expiry decisions. Client timer is display only.

- [ ] **Step 4: Add stale attempt cleanup path**

  When loading an expired in-progress attempt, mark it expired and allow results generation through the same scoring path.

---

## Phase 9: Final Verification

**Outcome:** We have evidence that schema, validation, scoring, rendering, routes, and UI compile and run.

**Commands:**

- [ ] **Step 1: Run unit tests**

  ```powershell
  npx tsx --test lib/mht-cet/tests/schema.test.ts
  npx tsx --test lib/mht-cet/questions/validate-question-import.test.ts
  npx tsx --test components/mht-cet/questions/QuestionContent.test.tsx
  npx tsx --test lib/mht-cet/mock-tests/config.test.ts
  npx tsx --test lib/mht-cet/mock-tests/select-questions.test.ts
  npx tsx --test lib/mht-cet/mock-tests/score-attempt.test.ts
  ```

- [ ] **Step 2: Run global checks**

  ```powershell
  npm run lint
  npx tsc --noEmit
  npm run build
  ```

- [ ] **Step 3: Run local app**

  ```powershell
  npm run dev
  ```

  Verify these flows manually:
  - `/mht-cet` shows a Mock Tests card.
  - `/mht-cet/mock-tests/new` creates a mock from approved test fixture questions.
  - Attempt autosaves after selecting answers.
  - Refreshing the attempt preserves responses.
  - Submitting shows results.
  - Results include subject and chapter tables.
  - Correct answers are not present in the attempt API response before submission.
  - Mobile viewport does not overlap text, timer, options, or navigator.

---

## Phase 10: Real Question Data Onboarding

**Outcome:** The platform can accept real year-wise question files after source authorization.

**Operator Flow:**

- [ ] Collect source file and source URL or permission note.
- [ ] Compute SHA-256 for the source file.
- [ ] Convert source into the import JSON format.
- [ ] Run validation script.
- [ ] Review all warnings and errors.
- [ ] Import validated rows as draft/validated.
- [ ] Approve source row.
- [ ] Manually review rendered questions in admin UI.
- [ ] Approve questions for public mocks.
- [ ] Run a smoke mock by year/subject/chapter.

**Important constraint:** Official-looking content must not be labeled official unless the source file and source URL prove it. Third-party public content must remain unverified until manually approved with a source note.

---

## Implementation Order

1. Phase 0 documentation.
2. Phase 1 schema/types.
3. Phase 2 validation/import pipeline.
4. Phase 4 scoring and selection logic.
5. Phase 3 renderer.
6. Phase 5 API routes.
7. Phase 6 student UI.
8. Phase 7 admin UI.
9. Phase 8 robustness.
10. Phase 9 verification.
11. Phase 10 real data onboarding.

This order keeps the riskiest correctness pieces, answer isolation and scoring, ahead of the polished UI.
