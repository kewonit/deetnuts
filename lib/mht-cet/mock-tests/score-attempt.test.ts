import assert from "node:assert/strict";
import test from "node:test";

import {
  scoreAttempt,
  type ScoreAttemptAnswer,
  type ScoreAttemptQuestion,
} from "./score-attempt";

const questions: ScoreAttemptQuestion[] = [
  { id: "q1", subject: "mathematics", chapterSlug: "functions", marks: 2 },
  { id: "q2", subject: "physics", chapterSlug: "motion-in-a-plane", marks: 1 },
  {
    id: "q3",
    subject: "chemistry",
    chapterSlug: "structure-of-atom",
    marks: 1,
  },
  { id: "q4", subject: "mathematics", chapterSlug: "circle", marks: 2 },
];

const answers: ScoreAttemptAnswer[] = [
  { questionId: "q1", correctOptionIds: ["a"] },
  { questionId: "q2", correctOptionIds: ["b"] },
  { questionId: "q3", correctOptionIds: ["c"] },
  { questionId: "q4", correctOptionIds: ["d"] },
];

test("scores correct, wrong, and unanswered responses without negative marking", () => {
  const result = scoreAttempt({
    questions,
    answers,
    responses: [
      { questionId: "q1", selectedOptionIds: ["a"], timeSpentSeconds: 30 },
      { questionId: "q2", selectedOptionIds: ["x"], timeSpentSeconds: 40 },
      { questionId: "q3", selectedOptionIds: [], timeSpentSeconds: 10 },
    ],
  });

  assert.equal(result.rawScore, 2);
  assert.equal(result.maxScore, 6);
  assert.equal(result.correctCount, 1);
  assert.equal(result.wrongCount, 1);
  assert.equal(result.unansweredCount, 2);
  assert.equal(result.timeSpentSeconds, 80);
});

test("marked-for-review but unanswered still counts as unanswered", () => {
  const result = scoreAttempt({
    questions: [questions[0]],
    answers: [answers[0]],
    responses: [
      { questionId: "q1", selectedOptionIds: [], markedForReview: true },
    ],
  });

  assert.equal(result.unansweredCount, 1);
  assert.equal(result.wrongCount, 0);
});

test("multi-response selection is wrong for single-correct questions", () => {
  const result = scoreAttempt({
    questions: [questions[0]],
    answers: [answers[0]],
    responses: [{ questionId: "q1", selectedOptionIds: ["a", "b"] }],
  });

  assert.equal(result.correctCount, 0);
  assert.equal(result.wrongCount, 1);
  assert.equal(result.rawScore, 0);
});

test("computes subject and chapter stats", () => {
  const result = scoreAttempt({
    questions,
    answers,
    responses: [
      { questionId: "q1", selectedOptionIds: ["a"], timeSpentSeconds: 30 },
      { questionId: "q2", selectedOptionIds: ["b"], timeSpentSeconds: 20 },
      { questionId: "q3", selectedOptionIds: ["wrong"], timeSpentSeconds: 10 },
      { questionId: "q4", selectedOptionIds: [], timeSpentSeconds: 5 },
    ],
  });

  assert.equal(result.subjectStats.mathematics.rawScore, 2);
  assert.equal(result.subjectStats.physics.correctCount, 1);
  assert.equal(result.chapterStats.functions.correctCount, 1);
  assert.equal(result.chapterStats["structure-of-atom"].wrongCount, 1);
});
