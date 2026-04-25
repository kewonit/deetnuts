import type { QuestionBlock } from "@/lib/mht-cet/questions/content-schema";
import type { ScoreAttemptResult } from "@/lib/mht-cet/mock-tests/score-attempt";
import type { MhtCetSubject } from "@/lib/mht-cet/schema";

export type AttemptOption = {
  id: string;
  option_order: number;
  body: QuestionBlock[];
  body_text?: string;
};

export type AttemptQuestion = {
  position: number;
  marks: number;
  subject: MhtCetSubject;
  question: {
    id: string;
    body: QuestionBlock[];
    body_text?: string;
    options?: AttemptOption[];
  };
};

export type AttemptResponse = {
  question_id: string;
  selected_option_ids: string[];
  visited: boolean;
  marked_for_review: boolean;
  time_spent_seconds: number;
};

export type AttemptPayload = {
  attempt: {
    id: string;
    status: string;
    ends_at: string;
    duration_seconds: number;
    question_count: number;
  };
  questions: AttemptQuestion[];
  responses: AttemptResponse[];
};

export type ResultsPayload = {
  attempt: {
    id: string;
    status: string;
    score_raw: number;
    max_score: number;
    correct_count: number;
    wrong_count: number;
    unanswered_count: number;
  };
  score: ScoreAttemptResult;
  review: Array<{
    position: number;
    question: {
      id: string;
      body: QuestionBlock[];
      options: AttemptOption[];
    };
    selectedOptionIds: string[];
    correctOptionIds: string[];
    explanation: QuestionBlock[] | null;
  }>;
};
