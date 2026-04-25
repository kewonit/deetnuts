import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

import practiceRows from "../data/mht-cet/question-bank/practice-2026-original.json";
import sampleRows from "../data/mht-cet/question-bank/sample-fixture.json";
import {
  validateQuestionImportRows,
  type ValidatedQuestionImportRow,
} from "../lib/mht-cet/questions/validate-question-import";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

function blocksToText(blocks: unknown) {
  return JSON.stringify(blocks)
    .replace(/[{}\[\]":,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const seedRows = [...sampleRows, ...practiceRows];
const validation = validateQuestionImportRows(seedRows, {
  mode: "development",
});
const errorCount = validation.errors.filter(
  (error) => error.severity === "error",
).length;

if (errorCount > 0) {
  console.error(`Question bank validation failed with ${errorCount} errors.`);
  for (const issue of validation.errors) {
    console.error(
      `${issue.severity.toUpperCase()} row ${issue.rowNumber} ${issue.fieldName}: ${issue.message}`,
    );
  }
  process.exit(1);
}

async function upsertSource(row: ValidatedQuestionImportRow) {
  const sourcePayload = {
    source_type: row.source.sourceType,
    title: row.source.title,
    year: row.source.year ?? row.year,
    exam_group: row.source.examGroup ?? row.examGroup ?? "pcm",
    source_url: row.source.sourceUrl,
    file_name: row.source.fileName,
    file_sha256: row.source.fileSha256,
    license_note: row.source.licenseNote,
    verification_status: "approved",
    reviewed_at: new Date().toISOString(),
  };

  if (row.source.fileSha256) {
    const { data: source, error: sourceError } = await supabase
      .from("mht_cet_question_sources")
      .upsert(sourcePayload, { onConflict: "file_sha256" })
      .select("id")
      .single();

    if (sourceError || !source) {
      throw new Error(sourceError?.message ?? "Could not upsert source.");
    }

    return (source as { id: string }).id;
  }

  if (!row.source.sourceUrl) {
    throw new Error("Source URL or file SHA-256 is required.");
  }

  const { data: existingSource, error: lookupError } = await supabase
    .from("mht_cet_question_sources")
    .select("id")
    .eq("source_url", row.source.sourceUrl)
    .eq("title", row.source.title)
    .eq("year", sourcePayload.year)
    .eq("exam_group", sourcePayload.exam_group)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existingSource) {
    const { data: source, error: sourceError } = await supabase
      .from("mht_cet_question_sources")
      .update(sourcePayload)
      .eq("id", (existingSource as { id: string }).id)
      .select("id")
      .single();

    if (sourceError || !source) {
      throw new Error(sourceError?.message ?? "Could not update source.");
    }

    return (source as { id: string }).id;
  }

  const { data: source, error: sourceError } = await supabase
    .from("mht_cet_question_sources")
    .insert(sourcePayload)
    .select("id")
    .single();

  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "Could not insert source.");
  }

  return (source as { id: string }).id;
}

async function seed() {
  let seededQuestions = 0;

  for (const row of validation.validRows) {
    const sourceId = await upsertSource(row);

    const { data: chapter, error: chapterError } = await supabase
      .from("mht_cet_chapters")
      .select("id")
      .eq("subject", row.subject)
      .eq("slug", row.chapterSlug ?? "")
      .maybeSingle();

    if (chapterError) {
      throw new Error(chapterError.message);
    }

    const { data: question, error: questionError } = await supabase
      .from("mht_cet_questions")
      .upsert(
        {
          source_id: sourceId,
          chapter_id: (chapter as { id?: string } | null)?.id,
          year: row.year,
          exam_group: row.examGroup ?? "pcm",
          subject: row.subject,
          difficulty: row.difficulty ?? "unknown",
          question_type: row.questionType,
          marks: row.marks ?? (row.subject === "mathematics" ? 2 : 1),
          negative_marks: row.negativeMarks ?? 0,
          body: row.body,
          body_text: blocksToText(row.body),
          body_sha256: row.bodySha256,
          verification_status: "approved",
        },
        { onConflict: "body_sha256,source_id" },
      )
      .select("id")
      .single();

    if (questionError || !question) {
      throw new Error(questionError?.message ?? "Could not upsert question.");
    }

    const questionId = (question as { id: string }).id;
    const { data: options, error: optionsError } = await supabase
      .from("mht_cet_question_options")
      .upsert(
        row.options.map((option, optionIndex) => ({
          question_id: questionId,
          option_order: optionIndex + 1,
          body: option.body,
          body_text: blocksToText(option.body),
        })),
        { onConflict: "question_id,option_order" },
      )
      .select("id, option_order");

    if (optionsError || !options) {
      throw new Error(optionsError?.message ?? "Could not upsert options.");
    }

    const optionByImportId = new Map<string, string>();
    for (const [optionIndex, option] of row.options.entries()) {
      const insertedOption = (
        options as Array<{ id: string; option_order: number }>
      ).find((item) => item.option_order === optionIndex + 1);

      if (!insertedOption) {
        throw new Error("Could not map saved options.");
      }

      optionByImportId.set(option.id, insertedOption.id);
    }

    const correctOptionIds = row.correctOptionIds.map((optionId) => {
      const savedOptionId = optionByImportId.get(optionId);

      if (!savedOptionId) {
        throw new Error(`Could not map correct option ${optionId}.`);
      }

      return savedOptionId;
    });

    const { error: answerError } = await supabase
      .from("mht_cet_question_answers")
      .upsert(
        {
          question_id: questionId,
          correct_option_ids: correctOptionIds,
          explanation: row.explanation,
          explanation_text: row.explanation
            ? blocksToText(row.explanation)
            : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "question_id" },
      );

    if (answerError) {
      throw new Error(answerError.message);
    }

    seededQuestions += 1;
  }

  console.log(
    `Seeded ${seededQuestions} approved MHT-CET practice questions for mock testing.`,
  );
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
