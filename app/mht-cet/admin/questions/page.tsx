import { createAdminClient } from "@/app/lib/supabase/admin";
import { QuestionContent } from "@/components/mht-cet/questions/QuestionContent";
import { QuestionReviewPanel } from "@/components/mht-cet/admin/QuestionReviewPanel";
import { requireMhtCetAdmin } from "@/lib/mht-cet/admin/auth";
import type { QuestionBlock } from "@/lib/mht-cet/questions/content-schema";

type ReviewQuestion = {
  id: string;
  subject: string;
  body: QuestionBlock[];
  verification_status: string;
  source?: { title?: string; verification_status?: string } | null;
};

export default async function MhtCetAdminQuestionsPage() {
  await requireMhtCetAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mht_cet_questions")
    .select(
      "id, subject, body, verification_status, source:mht_cet_question_sources(title, verification_status)",
    )
    .in("verification_status", ["draft", "validated"])
    .order("created_at", { ascending: false })
    .limit(50);
  const questions = (data ?? []) as ReviewQuestion[];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-5 pt-24">
      <h1 className="font-heading text-4xl">Question Review</h1>
      <div className="grid gap-5">
        {questions.map((question) => (
          <article
            className="grid gap-4 rounded-base border-2 border-black bg-white p-5 shadow-base"
            key={question.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-heading text-xl">{question.subject}</p>
                <p className="text-sm font-base">
                  {question.source?.title ?? "Unknown source"} -{" "}
                  {question.verification_status}
                </p>
              </div>
              <QuestionReviewPanel
                questionId={question.id}
                sourceApproved={
                  question.source?.verification_status === "approved"
                }
              />
            </div>
            <QuestionContent blocks={question.body} />
          </article>
        ))}
      </div>
    </main>
  );
}
