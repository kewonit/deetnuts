import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ATTEMPT_STATUSES,
  QUESTION_STATUSES,
  SOURCE_TYPES,
  SUBJECTS,
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

test("MHT-CET migration protects answers and response membership", () => {
  const migrationSql = readFileSync(
    new URL(
      "../../../supabase/migrations/20260425_mht_cet_testing_platform.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    migrationSql,
    /alter table public\.mht_cet_question_answers enable row level security;/,
  );
  assert.doesNotMatch(
    migrationSql,
    /create policy [\s\S]+ on public\.mht_cet_question_answers/,
  );
  assert.match(
    migrationSql,
    /foreign key \(attempt_id, question_id\)\s+references public\.mht_cet_mock_attempt_questions\(attempt_id, question_id\)/,
  );
  assert.match(
    migrationSql,
    /create policy "users upsert own responses"[\s\S]+for all[\s\S]+using \([\s\S]+\)\s+with check \(/,
  );
  assert.match(
    migrationSql,
    /insert into public\.mht_cet_chapters \(subject, standard, slug, name, official, active, sort_order\)/,
  );
  assert.match(
    migrationSql,
    /where s\.id = source_id and s\.verification_status = 'approved'/,
  );
});
