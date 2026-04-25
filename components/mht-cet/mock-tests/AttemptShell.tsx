"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuestionContent } from "@/components/mht-cet/questions/QuestionContent";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { QuestionNavigator } from "./QuestionNavigator";
import { TimerBar } from "./TimerBar";
import type { AttemptPayload, AttemptResponse } from "./types";

export function AttemptShell({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<AttemptPayload | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, AttemptResponse>>(
    {},
  );
  const [saveState, setSaveState] = useState("Ready");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch(`/api/mht-cet/mock-tests/attempts/${attemptId}`)
      .then(async (response) => {
        const data = (await response.json()) as
          | AttemptPayload
          | { error?: { message?: string } };

        if (!response.ok) {
          throw new Error(
            "error" in data
              ? data.error?.message
              : "Could not load this mock attempt.",
          );
        }

        return data as AttemptPayload;
      })
      .then((data: AttemptPayload) => {
        if (!mounted) {
          return;
        }

        setPayload(data);
        if (data.attempt.status !== "in_progress") {
          router.push(`/mht-cet/mock-tests/attempts/${attemptId}/results`);
          return;
        }

        setResponses(
          Object.fromEntries(
            data.responses.map((response) => [response.question_id, response]),
          ),
        );
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Could not load this mock.",
        );
        setSaveState("Load failed");
      });

    return () => {
      mounted = false;
    };
  }, [attemptId, router]);

  const activeQuestion = payload?.questions[activeIndex];
  const activeQuestionId = activeQuestion?.question.id ?? "";
  const activeResponse = responses[activeQuestionId];
  const answeredQuestionIds = useMemo(
    () =>
      new Set(
        Object.values(responses)
          .filter((response) => response.selected_option_ids.length > 0)
          .map((response) => response.question_id),
      ),
    [responses],
  );
  const markedQuestionIds = useMemo(
    () =>
      new Set(
        Object.values(responses)
          .filter((response) => response.marked_for_review)
          .map((response) => response.question_id),
      ),
    [responses],
  );

  async function saveResponse(
    questionId: string,
    selectedOptionIds: string[],
    markedForReview = false,
  ) {
    setSaveState("Saving");
    setResponses((current) => ({
      ...current,
      [questionId]: {
        question_id: questionId,
        selected_option_ids: selectedOptionIds,
        visited: true,
        marked_for_review: markedForReview,
        time_spent_seconds: current[questionId]?.time_spent_seconds ?? 0,
      },
    }));

    try {
      const response = await fetch(
        `/api/mht-cet/mock-tests/attempts/${attemptId}/responses`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            selectedOptionIds,
            visited: true,
            markedForReview,
          }),
        },
      );

      setSaveState(response.ok ? "Saved" : "Save failed");
    } catch {
      setSaveState("Save failed");
    }
  }

  async function submitAttempt() {
    setSaveState("Submitting");
    const response = await fetch(
      `/api/mht-cet/mock-tests/attempts/${attemptId}/submit`,
      {
        method: "POST",
      },
    );

    if (response.ok) {
      router.push(`/mht-cet/mock-tests/attempts/${attemptId}/results`);
      return;
    }

    setSaveState("Submit failed");
  }

  if (loadError) {
    return (
      <div className="mx-auto grid max-w-3xl gap-4 p-8 pt-24">
        <h1 className="font-heading text-3xl">Mock unavailable</h1>
        <p className="font-base">{loadError}</p>
        <Button onClick={() => router.push("/mht-cet/mock-tests/new")}>
          Create Mock
        </Button>
      </div>
    );
  }

  if (!payload || !activeQuestion) {
    return <div className="p-8 font-heading text-2xl">Loading mock...</div>;
  }

  return (
    <div className="min-h-screen bg-main/30">
      <TimerBar
        durationSeconds={payload.attempt.duration_seconds}
        endsAt={payload.attempt.ends_at}
      />
      <main className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-[1fr_320px] lg:p-8">
        <section className="grid gap-5 rounded-base border-2 border-black bg-white p-5 shadow-base">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-base border-2 border-black bg-main px-3 py-1 font-base">
              Question {activeIndex + 1} / {payload.questions.length}
            </span>
            <span className="font-base">{saveState}</span>
          </div>
          <QuestionContent blocks={activeQuestion.question.body} />
          <div className="grid gap-3">
            {(activeQuestion.question.options ?? [])
              .toSorted(
                (first, second) => first.option_order - second.option_order,
              )
              .map((option) => {
                const selected =
                  activeResponse?.selected_option_ids.includes(option.id) ??
                  false;
                return (
                  <button
                    className={cn(
                      "rounded-base border-2 border-black bg-white p-4 text-left shadow-base transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                      selected && "bg-main",
                    )}
                    key={option.id}
                    onClick={() => saveResponse(activeQuestionId, [option.id])}
                    type="button"
                  >
                    <QuestionContent blocks={option.body} variant="option" />
                  </button>
                );
              })}
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <Button
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
              variant="neutral"
            >
              Previous
            </Button>
            <Button
              onClick={() =>
                saveResponse(
                  activeQuestionId,
                  activeResponse?.selected_option_ids ?? [],
                  !(activeResponse?.marked_for_review ?? false),
                )
              }
              variant="neutral"
            >
              Mark Review
            </Button>
            <Button
              disabled={activeIndex === payload.questions.length - 1}
              onClick={() =>
                setActiveIndex((index) =>
                  Math.min(payload.questions.length - 1, index + 1),
                )
              }
            >
              Next
            </Button>
          </div>
        </section>
        <aside className="grid content-start gap-5 rounded-base border-2 border-black bg-white p-5 shadow-base">
          <QuestionNavigator
            activeIndex={activeIndex}
            answeredQuestionIds={answeredQuestionIds}
            markedQuestionIds={markedQuestionIds}
            onSelect={setActiveIndex}
            questionIds={payload.questions.map(
              (question) => question.question.id,
            )}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">Submit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit mock?</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={submitAttempt}>Submit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </aside>
      </main>
    </div>
  );
}
