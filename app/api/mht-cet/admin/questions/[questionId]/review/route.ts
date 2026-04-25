import { createAdminClient } from "@/app/lib/supabase/admin";
import { MhtCetAdminError, requireMhtCetAdmin } from "@/lib/mht-cet/admin/auth";
import { NextResponse } from "next/server";

function jsonError(error: MhtCetAdminError) {
  return NextResponse.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const user = await requireMhtCetAdmin();
    const { questionId } = await params;
    const body = (await request.json()) as { action?: string };
    const nextStatus = body.action === "approved" ? "approved" : "rejected";
    const supabase = createAdminClient();
    const { data: question, error: loadError } = await supabase
      .from("mht_cet_questions")
      .select("source_id, source:mht_cet_question_sources(verification_status)")
      .eq("id", questionId)
      .single();

    if (loadError || !question) {
      throw new MhtCetAdminError(
        404,
        "question_not_found",
        "Question not found.",
      );
    }

    const questionRecord = question as {
      source_id?: string;
      source?: { verification_status?: string };
    };
    const source = questionRecord.source;

    if (body.action === "approve_source") {
      const { error } = await supabase
        .from("mht_cet_question_sources")
        .update({
          verification_status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", questionRecord.source_id);

      if (error) {
        throw new MhtCetAdminError(
          500,
          "source_review_failed",
          "Could not approve source.",
        );
      }

      return NextResponse.json({ status: "source_approved" });
    }

    if (
      nextStatus === "approved" &&
      source?.verification_status !== "approved"
    ) {
      throw new MhtCetAdminError(
        409,
        "source_not_approved",
        "Approve the source before approving questions.",
      );
    }

    const { error } = await supabase
      .from("mht_cet_questions")
      .update({
        verification_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId);

    if (error) {
      throw new MhtCetAdminError(
        500,
        "review_failed",
        "Could not update review status.",
      );
    }

    return NextResponse.json({ status: nextStatus });
  } catch (error) {
    if (error instanceof MhtCetAdminError) {
      return jsonError(error);
    }

    return NextResponse.json(
      {
        error: { code: "review_failed", message: "Could not review question." },
      },
      { status: 500 },
    );
  }
}
