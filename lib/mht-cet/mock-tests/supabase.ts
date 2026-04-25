import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";

import { normalizeMockConfig, type NormalizedMhtCetMockConfig } from "./config";
import {
  scoreAttempt,
  type ScoreAttemptAnswer,
  type ScoreAttemptQuestion,
} from "./score-attempt";
import type {
  MockQuestionPoolItem,
  SelectedMockQuestion,
} from "./select-questions";

export class MhtCetMockTestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type UnknownRecord = Record<string, unknown>;

type AttemptResponseInput = {
  questionId: string;
  selectedOptionIds?: string[];
  visited?: boolean;
  markedForReview?: boolean;
  timeSpentSeconds?: number;
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getChapterSlug(row: UnknownRecord) {
  const chapter = row.chapter;

  if (Array.isArray(chapter)) {
    return asString(asRecord(chapter[0]).slug);
  }

  return asString(asRecord(chapter).slug);
}

function getChapterId(row: UnknownRecord) {
  return asString(row.chapter_id) || undefined;
}

function hasAttemptExpired(attempt: UnknownRecord) {
  return Date.now() > Date.parse(asString(attempt.ends_at));
}

async function logAttemptEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: {
    attemptId: string;
    userId: string;
    eventType: "created" | "response_saved" | "submitted" | "expired";
    metadata?: UnknownRecord;
  },
) {
  await supabase.from("mht_cet_mock_attempt_events").insert({
    attempt_id: event.attemptId,
    user_id: event.userId,
    event_type: event.eventType,
    metadata: event.metadata ?? {},
  });
}

function requireString(value: unknown, message: string) {
  if (typeof value !== "string" || !value) {
    throw new MhtCetMockTestError(500, "invalid_database_response", message);
  }

  return value;
}

function toPoolQuestion(row: UnknownRecord): MockQuestionPoolItem {
  return {
    id: requireString(row.id, "Question row is missing id."),
    subject: requireString(
      row.subject,
      "Question row is missing subject.",
    ) as MockQuestionPoolItem["subject"],
    chapterId: getChapterId(row),
    chapterSlug: getChapterSlug(row),
    year: typeof row.year === "number" ? row.year : undefined,
    marks: asNumber(row.marks, 1),
    verificationStatus: requireString(
      row.verification_status,
      "Question row is missing verification status.",
    ) as MockQuestionPoolItem["verificationStatus"],
  };
}

function hasApprovedSource(row: UnknownRecord) {
  return asRecord(row.source).verification_status === "approved";
}

export async function getCurrentUserOrUnauthorized() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new MhtCetMockTestError(
      401,
      "unauthorized",
      "Sign in to use mock tests.",
    );
  }

  return { user, supabase };
}

export async function loadApprovedQuestionPool(
  config: NormalizedMhtCetMockConfig,
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("mht_cet_questions")
    .select(
      "id, subject, chapter_id, year, marks, verification_status, chapter:mht_cet_chapters(slug), source:mht_cet_question_sources(verification_status)",
    )
    .eq("verification_status", "approved")
    .eq("exam_group", config.examGroup)
    .in("subject", config.subjects);

  if (config.year) {
    query = query.eq("year", config.year);
  }

  const { data, error } = await query;

  if (error) {
    throw new MhtCetMockTestError(
      500,
      "question_pool_failed",
      "Could not load approved questions.",
    );
  }

  return ((data ?? []) as unknown[])
    .filter((row) => hasApprovedSource(asRecord(row)))
    .map((row) => toPoolQuestion(asRecord(row)))
    .filter(
      (question) =>
        config.includeAllChapters ||
        config.chapterSlugs.includes(question.chapterSlug ?? ""),
    );
}

export async function createAttemptWithQuestions(
  userId: string,
  config: NormalizedMhtCetMockConfig,
  selectedQuestions: readonly SelectedMockQuestion[],
  seed: string,
) {
  const supabase = createAdminClient();
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + config.durationSeconds * 1000);
  const maxScore = selectedQuestions.reduce(
    (total, question) => total + question.marks,
    0,
  );
  const { data: attempt, error: attemptError } = await supabase
    .from("mht_cet_mock_attempts")
    .insert({
      user_id: userId,
      status: "in_progress",
      exam_group: config.examGroup,
      duration_seconds: config.durationSeconds,
      seed,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      question_count: selectedQuestions.length,
      max_score: maxScore,
      config,
    })
    .select("id")
    .single();

  if (attemptError) {
    throw new MhtCetMockTestError(
      500,
      "attempt_create_failed",
      "Could not create mock attempt.",
    );
  }

  const attemptId = requireString(
    asRecord(attempt).id,
    "Attempt insert did not return an id.",
  );
  const attemptQuestions = selectedQuestions.map((question) => ({
    attempt_id: attemptId,
    question_id: question.id,
    position: question.position,
    subject: question.subject,
    chapter_id: question.chapterId ?? null,
    marks: question.marks,
  }));
  const { error: questionsError } = await supabase
    .from("mht_cet_mock_attempt_questions")
    .insert(attemptQuestions);

  if (questionsError) {
    await supabase.from("mht_cet_mock_attempts").delete().eq("id", attemptId);
    throw new MhtCetMockTestError(
      500,
      "attempt_questions_create_failed",
      "Could not attach questions to mock attempt.",
    );
  }

  await logAttemptEvent(supabase, {
    attemptId,
    userId,
    eventType: "created",
    metadata: { questionCount: selectedQuestions.length },
  });

  return attemptId;
}

export async function loadAttemptForUser(attemptId: string, userId: string) {
  const supabase = createAdminClient();
  const { data: attempt, error: attemptError } = await supabase
    .from("mht_cet_mock_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();

  if (attemptError || !attempt) {
    throw new MhtCetMockTestError(
      404,
      "attempt_not_found",
      "Mock attempt not found.",
    );
  }

  const attemptRecord = asRecord(attempt);
  if (
    attemptRecord.status === "in_progress" &&
    hasAttemptExpired(attemptRecord)
  ) {
    await finalizeAttempt(attemptId, userId, "expired");
    return loadAttemptForUser(attemptId, userId);
  }

  const { data: questions, error: questionsError } = await supabase
    .from("mht_cet_mock_attempt_questions")
    .select(
      "position, marks, subject, question:mht_cet_questions(id, body, body_text, subject, year, options:mht_cet_question_options(id, option_order, body, body_text))",
    )
    .eq("attempt_id", attemptId)
    .order("position", { ascending: true });

  if (questionsError) {
    throw new MhtCetMockTestError(
      500,
      "attempt_questions_failed",
      "Could not load attempt questions.",
    );
  }

  const { data: responses, error: responsesError } = await supabase
    .from("mht_cet_mock_responses")
    .select(
      "question_id, selected_option_ids, visited, marked_for_review, time_spent_seconds, updated_at",
    )
    .eq("attempt_id", attemptId);

  if (responsesError) {
    throw new MhtCetMockTestError(
      500,
      "attempt_responses_failed",
      "Could not load saved responses.",
    );
  }

  return { attempt, questions: questions ?? [], responses: responses ?? [] };
}

export async function upsertAttemptResponse(
  attemptId: string,
  userId: string,
  response: AttemptResponseInput,
) {
  if (!response.questionId) {
    throw new MhtCetMockTestError(
      422,
      "invalid_response",
      "Question ID is required.",
    );
  }

  const supabase = createAdminClient();
  const { data: attempt, error: attemptError } = await supabase
    .from("mht_cet_mock_attempts")
    .select("status, ends_at")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();

  if (attemptError || !attempt) {
    throw new MhtCetMockTestError(
      404,
      "attempt_not_found",
      "Mock attempt not found.",
    );
  }

  const attemptRecord = asRecord(attempt);
  if (attemptRecord.status !== "in_progress") {
    throw new MhtCetMockTestError(
      409,
      "attempt_not_active",
      "This attempt is not active.",
    );
  }

  if (hasAttemptExpired(attemptRecord)) {
    await finalizeAttempt(attemptId, userId, "expired");
    throw new MhtCetMockTestError(
      409,
      "attempt_expired",
      "This attempt has expired.",
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("mht_cet_mock_attempt_questions")
    .select("question_id")
    .eq("attempt_id", attemptId)
    .eq("question_id", response.questionId)
    .single();

  if (membershipError || !membership) {
    throw new MhtCetMockTestError(
      422,
      "question_not_in_attempt",
      "Question is not part of this attempt.",
    );
  }

  const { error } = await supabase.from("mht_cet_mock_responses").upsert({
    attempt_id: attemptId,
    question_id: response.questionId,
    selected_option_ids: response.selectedOptionIds ?? [],
    visited: response.visited ?? true,
    marked_for_review: response.markedForReview ?? false,
    time_spent_seconds: Math.max(0, Math.trunc(response.timeSpentSeconds ?? 0)),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new MhtCetMockTestError(
      500,
      "response_save_failed",
      "Could not save response.",
    );
  }

  await logAttemptEvent(supabase, {
    attemptId,
    userId,
    eventType: "response_saved",
    metadata: { questionId: response.questionId },
  });

  return { ok: true };
}

async function loadScoringData(attemptId: string, userId: string) {
  const supabase = createAdminClient();
  const { data: attempt, error: attemptError } = await supabase
    .from("mht_cet_mock_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();

  if (attemptError || !attempt) {
    throw new MhtCetMockTestError(
      404,
      "attempt_not_found",
      "Mock attempt not found.",
    );
  }

  const { data: attemptQuestions, error: questionsError } = await supabase
    .from("mht_cet_mock_attempt_questions")
    .select("question_id, subject, chapter:mht_cet_chapters(slug), marks")
    .eq("attempt_id", attemptId);

  if (questionsError) {
    throw new MhtCetMockTestError(
      500,
      "scoring_questions_failed",
      "Could not load scoring questions.",
    );
  }

  const questionIds = (attemptQuestions ?? []).map((row) =>
    asString(asRecord(row).question_id),
  );
  const { data: answers, error: answersError } = await supabase
    .from("mht_cet_question_answers")
    .select("question_id, correct_option_ids")
    .in("question_id", questionIds);

  if (answersError) {
    throw new MhtCetMockTestError(
      500,
      "answer_key_failed",
      "Could not load answer keys.",
    );
  }

  const { data: responses, error: responsesError } = await supabase
    .from("mht_cet_mock_responses")
    .select(
      "question_id, selected_option_ids, marked_for_review, time_spent_seconds",
    )
    .eq("attempt_id", attemptId);

  if (responsesError) {
    throw new MhtCetMockTestError(
      500,
      "scoring_responses_failed",
      "Could not load responses.",
    );
  }

  const questions: ScoreAttemptQuestion[] = (attemptQuestions ?? []).map(
    (row) => {
      const record = asRecord(row);
      return {
        id: asString(record.question_id),
        subject: asString(record.subject) as ScoreAttemptQuestion["subject"],
        chapterSlug: getChapterSlug(record),
        marks: asNumber(record.marks, 1),
      };
    },
  );
  const answerRows: ScoreAttemptAnswer[] = (answers ?? []).map((row) => {
    const record = asRecord(row);
    return {
      questionId: asString(record.question_id),
      correctOptionIds: asStringArray(record.correct_option_ids),
    };
  });
  const responseRows = (responses ?? []).map((row) => {
    const record = asRecord(row);
    return {
      questionId: asString(record.question_id),
      selectedOptionIds: asStringArray(record.selected_option_ids),
      markedForReview: Boolean(record.marked_for_review),
      timeSpentSeconds: asNumber(record.time_spent_seconds),
    };
  });

  return {
    attempt: asRecord(attempt),
    questions,
    answers: answerRows,
    responses: responseRows,
  };
}

async function finalizeAttempt(
  attemptId: string,
  userId: string,
  forcedStatus?: "submitted" | "expired",
) {
  const supabase = createAdminClient();
  const scoringData = await loadScoringData(attemptId, userId);

  if (scoringData.attempt.status !== "in_progress") {
    throw new MhtCetMockTestError(
      409,
      "attempt_not_active",
      "This attempt is already closed.",
    );
  }

  const score = scoreAttempt(scoringData);
  const now = new Date().toISOString();
  const status =
    forcedStatus ??
    (hasAttemptExpired(scoringData.attempt) ? "expired" : "submitted");
  const { error } = await supabase
    .from("mht_cet_mock_attempts")
    .update({
      status,
      submitted_at: now,
      score_raw: score.rawScore,
      max_score: score.maxScore,
      correct_count: score.correctCount,
      wrong_count: score.wrongCount,
      unanswered_count: score.unansweredCount,
      time_spent_seconds: score.timeSpentSeconds,
      updated_at: now,
    })
    .eq("id", attemptId)
    .eq("user_id", userId);

  if (error) {
    throw new MhtCetMockTestError(
      500,
      "attempt_submit_failed",
      "Could not submit attempt.",
    );
  }

  await logAttemptEvent(supabase, {
    attemptId,
    userId,
    eventType: status,
    metadata: { rawScore: score.rawScore, maxScore: score.maxScore },
  });

  return {
    score,
    resultUrl: `/mht-cet/mock-tests/attempts/${attemptId}/results`,
  };
}

export async function submitAttempt(attemptId: string, userId: string) {
  return finalizeAttempt(attemptId, userId);
}

async function loadResultReview(attemptId: string) {
  const supabase = createAdminClient();
  const { data: questions, error: questionsError } = await supabase
    .from("mht_cet_mock_attempt_questions")
    .select(
      "position, question:mht_cet_questions(id, body, body_text, options:mht_cet_question_options(id, option_order, body, body_text), answer:mht_cet_question_answers(correct_option_ids, explanation, explanation_text))",
    )
    .eq("attempt_id", attemptId)
    .order("position", { ascending: true });

  if (questionsError) {
    throw new MhtCetMockTestError(
      500,
      "result_review_failed",
      "Could not load question review.",
    );
  }

  const { data: responses, error: responsesError } = await supabase
    .from("mht_cet_mock_responses")
    .select("question_id, selected_option_ids")
    .eq("attempt_id", attemptId);

  if (responsesError) {
    throw new MhtCetMockTestError(
      500,
      "result_responses_failed",
      "Could not load result responses.",
    );
  }

  const responseByQuestionId = new Map(
    (responses ?? []).map((row) => {
      const record = asRecord(row);
      return [
        asString(record.question_id),
        asStringArray(record.selected_option_ids),
      ];
    }),
  );

  return (questions ?? []).map((row) => {
    const record = asRecord(row);
    const question = asRecord(record.question);
    const answer = Array.isArray(question.answer)
      ? asRecord(question.answer[0])
      : asRecord(question.answer);
    const questionId = asString(question.id);

    return {
      position: asNumber(record.position),
      question: {
        id: questionId,
        body: question.body,
        options: question.options ?? [],
      },
      selectedOptionIds: responseByQuestionId.get(questionId) ?? [],
      correctOptionIds: asStringArray(answer.correct_option_ids),
      explanation: answer.explanation ?? null,
    };
  });
}

export async function loadAttemptResults(attemptId: string, userId: string) {
  let scoringData = await loadScoringData(attemptId, userId);

  if (
    asString(scoringData.attempt.status) === "in_progress" &&
    hasAttemptExpired(scoringData.attempt)
  ) {
    await finalizeAttempt(attemptId, userId, "expired");
    scoringData = await loadScoringData(attemptId, userId);
  }

  if (
    !["submitted", "expired", "abandoned"].includes(
      asString(scoringData.attempt.status),
    )
  ) {
    throw new MhtCetMockTestError(
      409,
      "results_unavailable",
      "Submit the attempt before viewing results.",
    );
  }

  return {
    attempt: scoringData.attempt,
    score: scoreAttempt(scoringData),
    review: await loadResultReview(attemptId),
  };
}

export function parseAttemptResponseInput(
  value: unknown,
): AttemptResponseInput {
  const record = asRecord(value);
  return {
    questionId: asString(record.questionId),
    selectedOptionIds: asStringArray(record.selectedOptionIds),
    visited: typeof record.visited === "boolean" ? record.visited : undefined,
    markedForReview:
      typeof record.markedForReview === "boolean"
        ? record.markedForReview
        : undefined,
    timeSpentSeconds:
      typeof record.timeSpentSeconds === "number"
        ? record.timeSpentSeconds
        : undefined,
  };
}

export function normalizeUnknownMockConfig(value: unknown) {
  return normalizeMockConfig(asRecord(value));
}
