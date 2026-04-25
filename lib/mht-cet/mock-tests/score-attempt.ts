import { SUBJECTS, type MhtCetSubject } from "../schema";

export type ScoreAttemptQuestion = {
  id: string;
  subject: MhtCetSubject;
  chapterSlug?: string;
  marks: number;
};

export type ScoreAttemptAnswer = {
  questionId: string;
  correctOptionIds: string[];
};

export type ScoreAttemptResponse = {
  questionId: string;
  selectedOptionIds?: string[];
  markedForReview?: boolean;
  timeSpentSeconds?: number;
};

export type ScoreBreakdown = {
  rawScore: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  accuracy: number;
};

export type ScoreAttemptResult = ScoreBreakdown & {
  subjectStats: Record<MhtCetSubject, ScoreBreakdown>;
  chapterStats: Record<string, ScoreBreakdown>;
};

function createEmptyBreakdown(): ScoreBreakdown {
  return {
    rawScore: 0,
    maxScore: 0,
    correctCount: 0,
    wrongCount: 0,
    unansweredCount: 0,
    timeSpentSeconds: 0,
    accuracy: 0,
  };
}

function updateAccuracy(breakdown: ScoreBreakdown) {
  const answeredCount = breakdown.correctCount + breakdown.wrongCount;
  breakdown.accuracy =
    answeredCount > 0 ? breakdown.correctCount / answeredCount : 0;
}

function selectedOptionSetEquals(selected: string[], correct: string[]) {
  if (selected.length !== correct.length) {
    return false;
  }

  const selectedSet = new Set(selected);
  return correct.every((optionId) => selectedSet.has(optionId));
}

function recordQuestionScore({
  breakdown,
  question,
  selectedOptionIds,
  correctOptionIds,
  timeSpentSeconds,
}: {
  breakdown: ScoreBreakdown;
  question: ScoreAttemptQuestion;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  timeSpentSeconds: number;
}) {
  breakdown.maxScore += question.marks;
  breakdown.timeSpentSeconds += timeSpentSeconds;

  if (selectedOptionIds.length === 0) {
    breakdown.unansweredCount += 1;
    updateAccuracy(breakdown);
    return;
  }

  if (selectedOptionSetEquals(selectedOptionIds, correctOptionIds)) {
    breakdown.correctCount += 1;
    breakdown.rawScore += question.marks;
  } else {
    breakdown.wrongCount += 1;
  }

  updateAccuracy(breakdown);
}

export function scoreAttempt({
  questions,
  answers,
  responses,
}: {
  questions: readonly ScoreAttemptQuestion[];
  answers: readonly ScoreAttemptAnswer[];
  responses: readonly ScoreAttemptResponse[];
}): ScoreAttemptResult {
  const answerByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  );
  const responseByQuestionId = new Map(
    responses.map((response) => [response.questionId, response]),
  );
  const result: ScoreAttemptResult = {
    ...createEmptyBreakdown(),
    subjectStats: Object.fromEntries(
      SUBJECTS.map((subject) => [subject, createEmptyBreakdown()]),
    ) as Record<MhtCetSubject, ScoreBreakdown>,
    chapterStats: {},
  };

  for (const question of questions) {
    const answer = answerByQuestionId.get(question.id);
    const response = responseByQuestionId.get(question.id);
    const selectedOptionIds = response?.selectedOptionIds ?? [];
    const correctOptionIds = answer?.correctOptionIds ?? [];
    const timeSpentSeconds = Math.max(0, response?.timeSpentSeconds ?? 0);
    const chapterSlug = question.chapterSlug ?? "uncategorized";

    result.chapterStats[chapterSlug] ??= createEmptyBreakdown();

    for (const breakdown of [
      result,
      result.subjectStats[question.subject],
      result.chapterStats[chapterSlug],
    ]) {
      recordQuestionScore({
        breakdown,
        question,
        selectedOptionIds,
        correctOptionIds,
        timeSpentSeconds,
      });
    }
  }

  return result;
}
