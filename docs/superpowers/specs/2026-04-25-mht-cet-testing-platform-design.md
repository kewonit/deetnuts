# MHT-CET Testing Platform Design

## Purpose

Build an MHT-CET mock-test platform inside the existing DEETNUTS Next.js app. Students should be able to choose year, subject, chapters, question count, and test duration; attempt a timed mock; review answers after submission; and see clear performance statistics by subject, chapter, accuracy, score, and time.

The platform must not invent question data. It should automate discovery, validation, import, rendering checks, duplicate detection, and review workflows, but only approved questions from verified or explicitly accepted sources should appear in public mocks.

## Verified Research Notes

Research was performed against the live repo, Context7 docs, and official CET Cell pages on 2026-04-25.

### Official Source Signals

The official CET Cell site currently exposes:

- CET Cell home and current notices: `https://cetcell.mahacet.org/`
- Official syllabus index: `https://cetcell.mahacet.org/syllabus-and-marking-scheme/`
- 2024 technical syllabus PDF: `https://cetcell.mahacet.org/wp-content/uploads/2023/08/Technical_Education_CET_syllabus2024-25.pdf`
- 2026 MHT-CET normalization PDF: `https://cetcell.mahacet.org/wp-content/uploads/2023/12/MHT-CET-2026-Result-Processing-Methodology.pdf`
- 2025 official mock-test link PDF: `https://cetcell.mahacet.org/wp-content/uploads/2023/12/Mocktest_links-3.pdf`
- 2025 PCM objection schedule notice: `https://cetcell.mahacet.org/wp-content/uploads/2023/12/Notice_OT_-MHT-CET-PCM.pdf`

From the extractable 2024 technical syllabus PDF:

- Questions are based on State Council of Educational Research and Training, Maharashtra syllabus.
- Approximately 20% weightage is from Std XI and 80% from Std XII.
- There is no negative marking.
- Questions are MCQ and mainly application based.
- Mathematics is 50 questions: 10 Std XI, 40 Std XII, 2 marks per question, 100 marks, 90 minutes.
- Physics and Chemistry together are 100 questions: 10 Std XI and 40 Std XII per subject, 1 mark per question, 100 marks, 90 minutes.
- The official Std XI chapter list from that PDF includes:
  - Physics: Motion in a plane, Laws of Motion, Gravitation, Thermal properties of matter, Sound, Optics, Electrostatics, Semiconductors.
  - Chemistry: Some Basic concepts of chemistry, Structure of atom, Chemical Bonding, Redox reactions, Elements of group 1 and 2, States of Matter (Gaseous and Liquids), Adsorption and colloids (Surface Chemistry), Hydrocarbons, Basic principles of organic chemistry.
  - Mathematics: Trigonometry II, Straight Line, Circle, Measures of Dispersion, Probability, Complex Numbers, Permutations and Combinations, Functions, Limits, Continuity.

From the official 2026 normalization PDF:

- MHT-CET uses multiple shifts with different question sets.
- Percentile score is the normalized score rather than raw marks.
- Percentiles are calculated separately by session and up to 7 decimal places.
- Total percentile is not the aggregate or average of subject percentiles.

From the official 2025 mock-test link PDF:

- MHT-CET PCM mock link: `https://mock.mhexam.com/pcm/`
- MHT-CET PCB mock link: `https://mock.mhexam.com/pcb/`
- Automated access from this environment returned HTTP 403, so the questions behind those pages cannot be treated as fetched or verified here.

From the official 2025 PCM objection notice:

- Display of question paper, candidate response, correct answer key, and objection submission happened through candidate login during a fixed schedule.
- The notice confirms the existence of official question/answer-key flows, but not a publicly accessible year-wise question bank.

### Non-Hallucination Boundary

I did not find a verified public, year-wise MHT-CET question corpus that can be safely imported from the open web during this session. The implementation must therefore support reliable imports and automated/manual verification rather than seeding fake questions or claiming official year-wise coverage without source files.

## Existing Codebase Context

- Framework: Next.js App Router 16.1.4 with React 19.2.3.
- Styling: Tailwind CSS 3.4.1 with neobrutalist project styling and shared UI primitives.
- Data: Supabase Postgres is the live backend; PocketBase naming appears only in compatibility layers.
- Auth: Supabase Auth through `@supabase/ssr` helpers under `app/lib/supabase` and `lib/supabaseAuth.ts`.
- Current MHT-CET area: `app/mht-cet`, protected state-cutoffs flow, state cutoff APIs, college pages, and MHT-CET metadata.
- Current tests: `node:test` plus `node:assert/strict`; no dedicated test script exists in `package.json` yet.

## Recommended Product Shape

### Student Routes

- `/mht-cet/mock-tests`: landing/dashboard with active attempts, recent stats, and start actions.
- `/mht-cet/mock-tests/new`: mock builder for group, subjects, chapters, year filters, question count, and duration.
- `/mht-cet/mock-tests/attempts/[attemptId]`: timed attempt UI.
- `/mht-cet/mock-tests/attempts/[attemptId]/results`: review, stats, answer table, and chapter breakdown.

### Admin / Ops Routes

- `/mht-cet/admin/questions`: protected review queue for imported questions.
- `/mht-cet/admin/imports`: import-batch status, validation errors, duplicate groups, and source audit trail.

Admin routes should be guarded by server-side checks using a small allowlist of admin user IDs/emails in environment configuration. Public clients must never receive answer keys during an active attempt.

## Data Model

### Core Tables

- `mht_cet_question_sources`: one row per source file, URL, or manual import batch. Stores year, group, source type, source URL, file hash, license/permission notes, verification status, and reviewer metadata.
- `mht_cet_chapters`: canonical subject/chapter list with subject, standard, slug, official source URL, sort order, and active flag.
- `mht_cet_questions`: approved/renderable question body without answer key leakage. Stores subject, chapter, year, group, difficulty, marks, negative marks, body JSON, searchable text, source ID, body hash, review status, and quality flags.
- `mht_cet_question_options`: option text/media for each question, stable option IDs, and render metadata. Does not contain correctness flags.
- `mht_cet_question_answers`: correct option IDs and explanation body. No public select policy.
- `mht_cet_question_import_batches`: import run summary, counts, source hash, validation status, and operator.
- `mht_cet_question_import_errors`: row-level validation failures with row number, field, severity, and message.

### Attempt Tables

- `mht_cet_mock_attempts`: one attempt per student. Stores user ID, status, group, duration, start/end/submit timestamps, seed, scoring summary, and metadata.
- `mht_cet_mock_attempt_questions`: ordered immutable question snapshot for the attempt.
- `mht_cet_mock_responses`: selected options, marked-for-review state, visited state, and time spent per question.
- `mht_cet_mock_attempt_events`: optional audit trail for start, autosave, submit, expire, and reconnect events.

### Stats Views

- `mht_cet_attempt_subject_stats`: subject-level score, correct, wrong, unanswered, accuracy, and average time.
- `mht_cet_attempt_chapter_stats`: chapter-level score, accuracy, and time.
- `mht_cet_user_mock_stats`: user aggregate attempts, best score, average accuracy, and recent trend.

Percentile should not be shown as official unless a verified calibration dataset exists. The platform may show raw score, percentage, accuracy, and relative performance against DEETNUTS attempts when enough local attempts exist, clearly labeled as platform stats.

## Question Rendering Model

Use structured JSON content instead of arbitrary HTML.

Supported blocks:

- `paragraph`: plain text with optional inline math spans.
- `math`: display or inline TeX.
- `image`: Supabase Storage path or approved remote URL with alt text and dimensions.
- `table`: rows/cells for data interpretation questions.
- `list`: ordered or unordered text list.

Rendering rules:

- No raw HTML in imported question bodies.
- TeX is rendered with KaTeX using `throwOnError: false`, `trust: false`, `strict: "warn"`, and `output: "htmlAndMathml"`.
- Invalid math renders as a visible review warning in admin and as safe fallback text in public only after approval.
- Images require alt text, width, height, source reference, and successful validation.
- Long question content must not resize fixed test controls or cause answer buttons to jump.

## Attempt Lifecycle

1. Student creates a mock by choosing default MHT-CET or custom configuration.
2. Server validates auth and configuration.
3. Server selects approved questions using deterministic seed and chapter/subject constraints.
4. Server creates `mht_cet_mock_attempts` plus ordered question snapshot rows.
5. Client renders the timed attempt and autosaves responses through route handlers.
6. Submit or expiry triggers server-side scoring only.
7. Result page reads summary stats and answer explanations after submission.

## Default Mock Modes

- Full PCM simulation: 150 questions, 180 minutes, with a 90-minute Mathematics section and 90-minute Physics/Chemistry section if the UI enforces sections.
- Mathematics section: 50 questions, 90 minutes, 2 marks per question.
- Physics/Chemistry section: 100 questions, 90 minutes, 1 mark per question.
- Custom chapter drill: student chooses chapters, question count, and duration within safe limits.

The first implementation can support one continuous timer and still store the official section metadata. A later phase can enforce section transitions.

## Edge Cases

### Data Quality

- Duplicate questions across years or providers.
- Same question body with shuffled options.
- Missing or ambiguous answer key.
- Multiple correct answers in a single-correct test.
- Broken image references.
- Invalid TeX.
- Chapter names that do not match canonical chapters.
- Imported questions without verified source metadata.
- Source files with changed content under the same filename.

### Test Generation

- Not enough approved questions for selected chapters.
- Student chooses duration too short or too long.
- Student requests zero questions.
- Requested subject mix cannot satisfy official/default ratios.
- Retry after partial attempt creation.
- Concurrent attempt creation double-click.

### Attempt Runtime

- Browser refresh or network loss.
- Multiple tabs for same attempt.
- Timer drift between client and server.
- Expired attempts submitted late.
- Autosave race conditions.
- User signs out mid-attempt.
- User tries to fetch answers before submission.

### Results

- Attempt has unanswered questions.
- Source question was later deactivated after attempt started.
- Explanation missing for a valid approved question.
- Stats table with many chapters on mobile.
- Platform percentile unavailable because local sample size is too small.

## Security Model

- Public users can read approved question bodies and options only as part of an attempt.
- Answer keys are never directly selectable by anon/authenticated clients.
- Attempts and responses are user-owned through RLS.
- Admin review and import writes use server-only service role paths.
- Import endpoints require admin authorization, size limits, MIME validation, and batch audit rows.
- Server route handlers verify Supabase `auth.getUser()` for authorization decisions.

## Testing Strategy

Use TDD for implementation.

- Unit tests for validation, scoring, question selection, duration clamping, and render-token parsing.
- SQL migration review for RLS and answer-key isolation.
- API route tests around unauthorized access, attempt creation, autosave, submit, and late submit.
- Component tests for question renderer and stats tables using server-rendered markup where possible.
- Manual browser verification for mobile and desktop once UI exists.

## Implementation Acceptance

Phase 1 is successful when:

- Supabase schema exists for sources, questions, answers, attempts, responses, and stats views.
- Import validation rejects unsafe/unverified/malformed questions.
- Approved sample fixture questions can be imported from a local, explicitly marked test fixture.
- Students can start a mock from approved questions, autosave, submit, and view stats.
- No public path exposes correct answers before submission.
- The plan documents the unresolved source reality clearly: official question content must come from supplied exports, verified licensed sources, or manually reviewed imports.

## Deliberate Non-Goals For First Implementation

- No claim of official year-wise question coverage without verified source files.
- No official percentile prediction from raw mock scores.
- No scraping of candidate-login pages.
- No paid provider integration until source licensing/permission is known.
- No proctoring or anti-cheat beyond basic attempt integrity.
