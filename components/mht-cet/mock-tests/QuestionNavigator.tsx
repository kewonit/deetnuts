"use client";

import { cn } from "@/lib/utils";

export function QuestionNavigator({
  activeIndex,
  answeredQuestionIds,
  markedQuestionIds,
  questionIds,
  onSelect,
}: {
  activeIndex: number;
  answeredQuestionIds: Set<string>;
  markedQuestionIds: Set<string>;
  questionIds: string[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-5">
      {questionIds.map((questionId, index) => (
        <button
          className={cn(
            "aspect-square rounded-base border-2 border-black bg-white text-sm font-base",
            answeredQuestionIds.has(questionId) && "bg-main",
            markedQuestionIds.has(questionId) &&
              "ring-2 ring-black ring-offset-2",
            activeIndex === index && "shadow-base",
          )}
          key={questionId}
          onClick={() => onSelect(index)}
          type="button"
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
