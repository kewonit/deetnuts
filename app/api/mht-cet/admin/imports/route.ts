import { createAdminClient } from "@/app/lib/supabase/admin";
import { MhtCetAdminError, requireMhtCetAdmin } from "@/lib/mht-cet/admin/auth";
import { validateQuestionImportRows } from "@/lib/mht-cet/questions/validate-question-import";
import { NextResponse } from "next/server";

function blocksToText(blocks: unknown) {
  return JSON.stringify(blocks)
    .replace(/[{}\[\]":,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jsonError(error: MhtCetAdminError) {
  return NextResponse.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireMhtCetAdmin();
    const payload = (await request.json()) as
      | { questions?: unknown[]; fileName?: string }
      | unknown[];
    const rows = Array.isArray(payload) ? payload : payload.questions;

    if (!Array.isArray(rows)) {
      throw new MhtCetAdminError(
        422,
        "invalid_payload",
        "Provide an array or questions array.",
      );
    }

    const validation = validateQuestionImportRows(rows, { mode: "production" });
    const errorCount = validation.errors.filter(
      (error) => error.severity === "error",
    ).length;

    if (errorCount > 0) {
      return NextResponse.json(
        {
          acceptedRows: 0,
          rejectedRows: rows.length,
          errors: validation.errors,
        },
        { status: 422 },
      );
    }

    const supabase = createAdminClient();
    let firstSourceId: string | null = null;

    for (const row of validation.validRows) {
      const sourcePayload = {
        source_type: row.source.sourceType,
        title: row.source.title,
        year: row.source.year ?? row.year,
        exam_group: row.source.examGroup ?? row.examGroup ?? "pcm",
        source_url: row.source.sourceUrl,
        file_name: row.source.fileName,
        file_sha256: row.source.fileSha256,
        license_note: row.source.licenseNote,
        verification_status: "validated",
      };
      const { data: source, error: sourceError } = row.source.fileSha256
        ? await supabase
            .from("mht_cet_question_sources")
            .upsert(sourcePayload, { onConflict: "file_sha256" })
            .select("id")
            .single()
        : await supabase
            .from("mht_cet_question_sources")
            .insert(sourcePayload)
            .select("id")
            .single();

      if (sourceError || !source) {
        throw new MhtCetAdminError(
          500,
          "source_insert_failed",
          "Could not insert question source.",
        );
      }

      firstSourceId ??= (source as { id: string }).id;

      const { data: chapter } = await supabase
        .from("mht_cet_chapters")
        .select("id")
        .eq("subject", row.subject)
        .eq("slug", row.chapterSlug ?? "")
        .maybeSingle();
      const { data: question, error: questionError } = await supabase
        .from("mht_cet_questions")
        .insert({
          source_id: (source as { id: string }).id,
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
          verification_status: "validated",
        })
        .select("id")
        .single();

      if (questionError || !question) {
        throw new MhtCetAdminError(
          500,
          "question_insert_failed",
          "Could not insert question.",
        );
      }

      const questionId = (question as { id: string }).id;
      const { data: options, error: optionsError } = await supabase
        .from("mht_cet_question_options")
        .insert(
          row.options.map((option, optionIndex) => ({
            question_id: questionId,
            option_order: optionIndex + 1,
            body: option.body,
            body_text: blocksToText(option.body),
          })),
        )
        .select("id, option_order");

      if (optionsError || !options) {
        throw new MhtCetAdminError(
          500,
          "option_insert_failed",
          "Could not insert options.",
        );
      }

      const insertedOptions = options as Array<{
        id: string;
        option_order: number;
      }>;
      const optionByImportId = new Map<string, string>();

      for (const [optionIndex, option] of row.options.entries()) {
        const insertedOption = insertedOptions.find(
          (item) => item.option_order === optionIndex + 1,
        );

        if (!insertedOption) {
          throw new MhtCetAdminError(
            500,
            "option_mapping_failed",
            "Could not map imported options to saved options.",
          );
        }

        optionByImportId.set(option.id, insertedOption.id);
      }

      const correctOptionIds = row.correctOptionIds
        .map((optionId) => optionByImportId.get(optionId))
        .filter((optionId): optionId is string => Boolean(optionId));

      if (correctOptionIds.length !== row.correctOptionIds.length) {
        throw new MhtCetAdminError(
          500,
          "answer_mapping_failed",
          "Could not map correct answers to saved options.",
        );
      }

      const { error: answerError } = await supabase
        .from("mht_cet_question_answers")
        .insert({
          question_id: questionId,
          correct_option_ids: correctOptionIds,
          explanation: row.explanation,
          explanation_text: row.explanation
            ? blocksToText(row.explanation)
            : null,
        });

      if (answerError) {
        throw new MhtCetAdminError(
          500,
          "answer_insert_failed",
          "Could not insert answer key.",
        );
      }
    }

    if (validation.validRows[0] && firstSourceId) {
      const firstRow = validation.validRows[0];
      await supabase.from("mht_cet_question_import_batches").insert({
        source_id: firstSourceId,
        imported_by: user.id,
        file_name: Array.isArray(payload)
          ? "json-upload"
          : (payload.fileName ?? "json-upload"),
        file_sha256: firstRow.source.fileSha256 ?? firstRow.bodySha256,
        total_rows: rows.length,
        accepted_rows: validation.validRows.length,
        rejected_rows: 0,
        status: "imported",
      });
    }

    return NextResponse.json({
      acceptedRows: validation.validRows.length,
      rejectedRows: 0,
    });
  } catch (error) {
    if (error instanceof MhtCetAdminError) {
      return jsonError(error);
    }

    return NextResponse.json(
      {
        error: {
          code: "import_failed",
          message: "Could not import questions.",
        },
      },
      { status: 500 },
    );
  }
}
