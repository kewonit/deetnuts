"use client";

import { QuestionContent } from "@/components/mht-cet/questions/QuestionContent";
import { useEffect, useState } from "react";

import { StatsTables } from "./StatsTables";
import type { ResultsPayload } from "./types";

export function ResultsSummary({ attemptId }: { attemptId: string }) {
  const [payload, setPayload] = useState<ResultsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/mht-cet/mock-tests/attempts/${attemptId}/results`)
      .then(async (response) => {
        const data = (await response.json()) as
          | ResultsPayload
          | { error?: { message?: string } };

        if (!response.ok) {
          throw new Error(
            "error" in data
              ? data.error?.message
              : "Could not load these results.",
          );
        }

        return data as ResultsPayload;
      })
      .then((data) => setPayload(data))
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load these results.",
        ),
      );
  }, [attemptId]);

  if (error) {
    return (
      <div className="mx-auto grid max-w-3xl gap-3 p-8 pt-24">
        <h1 className="font-heading text-3xl">Results unavailable</h1>
        <p className="font-base">{error}</p>
      </div>
    );
  }

  if (!payload) {
    return <div className="p-8 font-heading text-2xl">Loading results...</div>;
  }

  const summaryCards = [
    ["Score", `${payload.score.rawScore} / ${payload.score.maxScore}`],
    ["Correct", payload.score.correctCount],
    ["Wrong", payload.score.wrongCount],
    ["Unanswered", payload.score.unansweredCount],
  ];

  function optionLabel(
    optionIds: string[],
    options: ResultsPayload["review"][number]["question"]["options"],
  ) {
    if (optionIds.length === 0) {
      return "Unanswered";
    }

    return optionIds
      .map((optionId) => {
        const option = options.find((item) => item.id === optionId);
        return option
          ? String.fromCharCode(64 + option.option_order)
          : "Unknown";
      })
      .join(", ");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 p-5 pt-24">
      <header className="grid gap-2">
        <h1 className="font-heading text-4xl">Mock Results</h1>
        <p className="font-base">Raw score and DEETNUTS attempt stats.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-4">
        {summaryCards.map(([label, value]) => (
          <div
            className="rounded-base border-2 border-black bg-main p-5 shadow-base"
            key={label}
          >
            <p className="text-sm font-base">{label}</p>
            <p className="mt-2 font-heading text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <StatsTables score={payload.score} />
      <section className="grid gap-4">
        <h2 className="font-heading text-3xl">Question Review</h2>
        {payload.review.map((item) => {
          const answered = item.selectedOptionIds.length > 0;
          const correct =
            answered &&
            item.correctOptionIds.length === item.selectedOptionIds.length &&
            item.correctOptionIds.every((optionId) =>
              item.selectedOptionIds.includes(optionId),
            );

          return (
            <article
              className="grid gap-4 rounded-base border-2 border-black bg-white p-5 shadow-base"
              key={item.question.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-heading text-xl">
                  Question {item.position}
                </h3>
                <span className="rounded-base border-2 border-black bg-main px-3 py-1 text-sm font-base">
                  {!answered ? "Unanswered" : correct ? "Correct" : "Review"}
                </span>
              </div>
              <QuestionContent blocks={item.question.body} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <tbody>
                    <tr>
                      <th className="border-2 border-black bg-main p-3">
                        Selected
                      </th>
                      <td className="border-2 border-black p-3">
                        {optionLabel(
                          item.selectedOptionIds,
                          item.question.options,
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="border-2 border-black bg-main p-3">
                        Correct
                      </th>
                      <td className="border-2 border-black p-3">
                        {optionLabel(
                          item.correctOptionIds,
                          item.question.options,
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {item.explanation ? (
                <QuestionContent blocks={item.explanation} />
              ) : (
                <p className="font-base">
                  Explanation is not available for this question.
                </p>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
